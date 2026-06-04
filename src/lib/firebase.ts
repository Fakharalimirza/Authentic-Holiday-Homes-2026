import { 
  getFirestore,
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  runTransaction,
  onSnapshot
} from './mysql-adapter';

// Re-export all database-bridge mock operations so pages won't break
export {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  runTransaction,
  onSnapshot
};

export const db = getFirestore();

// Mock Firebase Storage APIs (directing deleting to a safe console/state check)
export const storage = {
  type: 'storage'
};
export function ref(storageRef: any, pathVal: string) {
  return { type: 'storage_ref', path: pathVal };
}
export async function deleteObject(storageRef: any) {
  console.log("Mock Storage: Deleted object reference safely at path:", storageRef?.path);
  return true;
}

// Custom Local Auth Implementation (completely replaces Firebase Auth!)
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: string;
  getIdToken?: () => Promise<string>;
}

class FirebaseAuthMock {
  private listeners: Set<(user: User | null) => void> = new Set();
  public currentUser: User | null = null;

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    const userStr = localStorage.getItem("ahh_user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        this.currentUser = {
          ...parsed,
          getIdToken: async () => localStorage.getItem("ahh_token") || "mock_token"
        };
      } catch (e) {
        this.currentUser = null;
      }
    } else {
      this.currentUser = null;
    }
  }

  get currentUserVal(): User | null {
    return this.currentUser;
  }

  registerListener(cb: (user: User | null) => void): () => void {
    this.listeners.add(cb);
    // Immediate callback trigger
    cb(this.currentUser);
    return () => {
      this.listeners.delete(cb);
    };
  }

  updateUserSession(user: User | null, token?: string) {
    if (user) {
      const parsedUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      };
      localStorage.setItem("ahh_user", JSON.stringify(parsedUser));
      if (token) {
        localStorage.setItem("ahh_token", token);
      }
      this.currentUser = {
        ...parsedUser,
        getIdToken: async () => localStorage.getItem("ahh_token") || "mock_token"
      };
    } else {
      this.currentUser = null;
      localStorage.removeItem("ahh_user");
      localStorage.removeItem("ahh_token");
      sessionStorage.removeItem("ahh_login_logged");
    }
    // Notify all active listeners
    this.listeners.forEach((cb) => {
      try { cb(this.currentUser); } catch (e) {}
    });
  }
}

export const auth = new FirebaseAuthMock();

export function getAuth() {
  return auth;
}

export function onAuthStateChanged(authInstance: FirebaseAuthMock, next: (user: User | null) => void) {
  return authInstance.registerListener(next);
}

// Sign-In with Email & Password
export async function signInWithEmailAndPassword(authInstance: FirebaseAuthMock, emailVal: string, passwordVal: string): Promise<{ user: User }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: emailVal, password: passwordVal })
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed credential login verification.");
  }

  const payload = await res.json();
  const matchedUser: User = {
    uid: payload.user.uid,
    email: payload.user.email,
    displayName: payload.user.displayName,
    role: payload.user.role
  };

  authInstance.updateUserSession(matchedUser, payload.token);
  return { user: matchedUser };
}

// User Registration with Email & Password
export async function createUserWithEmailAndPassword(authInstance: FirebaseAuthMock, emailVal: string, passwordVal: string): Promise<{ user: User }> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: emailVal, password: passwordVal })
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed registration setup.");
  }

  const payload = await res.json();
  const matchedUser: User = {
    uid: payload.user.uid,
    email: payload.user.email,
    displayName: payload.user.displayName,
    role: payload.user.role
  };

  authInstance.updateUserSession(matchedUser, payload.token);
  return { user: matchedUser };
}

// Sign-Out
export async function signOut(authInstance: FirebaseAuthMock): Promise<void> {
  authInstance.updateUserSession(null);
}

// OAuth Providers simulation
export class GoogleAuthProvider {}
export class OAuthProvider {
  constructor(public providerId: string) {}
}

export async function signInWithPopup(authInstance: FirebaseAuthMock, provider: any): Promise<void> {
  if (provider instanceof GoogleAuthProvider) {
    // 1. Fetch Google auth URL from Express backend
    const redirectUri = `${window.location.origin}/auth/callback`;
    const res = await fetch(`/api/auth/google/url?redirectUri=${encodeURIComponent(redirectUri)}`);
    if (!res.ok) {
      throw new Error("Failed to initialize Google Authentication on the backend.");
    }
    const { url } = await res.json();
    
    // 2. Open standard popup window
    const popup = window.open(url, "google_oauth_popup", "width=500,height=650");
    if (!popup) {
      throw new Error("Popup blocked. Please enable popups for this site inside your browser settings.");
    }
    
    // 3. Hear message from popup
    return new Promise<void>((resolve, reject) => {
      let isCompleted = false;
      const handleMessage = (event: MessageEvent) => {
        // Safe origin validation - check that message originates from either localhost, the container, or standard sub-domains
        const origin = event.origin;
        const isValidOrigin = 
          origin === window.location.origin ||
          origin.includes("localhost") || 
          origin.includes("127.0.0.1") || 
          origin.endsWith(".run.app");

        if (!isValidOrigin) return;
        
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          const { user, token } = event.data;
          if (user && token) {
            isCompleted = true;
            clearInterval(checkClosed);
            authInstance.updateUserSession(user, token);
            window.removeEventListener('message', handleMessage);
            resolve();
          } else {
            isCompleted = true;
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            reject(new Error("Google authentication succeeded, but user data was missing."));
          }
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Safety check: close listener when popup is manual-closed by user without logging in
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          if (!isCompleted) {
            reject(new Error("Login cancelled by user (Google popup window was closed)."));
          }
        }
      }, 1000);
    });
  } else {
    throw new Error("Unsupported authentication provider. Only Google Sign-In is enabled.");
  }
}
