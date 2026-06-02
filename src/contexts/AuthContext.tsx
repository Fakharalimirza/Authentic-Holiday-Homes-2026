import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, User, onAuthStateChanged, doc, getDoc, setDoc, onSnapshot, serverTimestamp } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: any | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  profile: null,
  isAuthModalOpen: false,
  setIsAuthModalOpen: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }
      if (currentUser) {
        console.log("Auth: Listening to profile for", currentUser.uid);
        unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (currentUser.email?.toLowerCase() === 'fakharalimirza@gmail.com' && data.role !== 'super_admin') {
              console.log("Auth: Upgrading admin to super_admin role");
              await setDoc(doc(db, 'users', currentUser.uid), { role: 'super_admin' }, { merge: true });
            }
            setProfile(data);

            // Audit Log: On successful sign-in
            const sessionLogged = sessionStorage.getItem('ahh_login_logged');
            if (!sessionLogged) {
              sessionStorage.setItem('ahh_login_logged', 'true');
              import('../lib/auditLogger').then(({ logActivity }) => {
                logActivity('LOGIN', `User session started. Authenticated via Portal Access`, data);
              });
            }

            setLoading(false);
          } else {
            console.log("Auth: Profile not found, creating initial...");
            const newProfile = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || 'Guest',
              role: currentUser.email?.toLowerCase() === 'fakharalimirza@gmail.com' ? 'super_admin' : 'guest',
              createdAt: serverTimestamp(),
              wishlist: []
            };
            try {
              await setDoc(doc(db, 'users', currentUser.uid), newProfile);
              setProfile({ ...newProfile, createdAt: new Date().toISOString() });
              
              // Audit Log: Newly created user sign up
              import('../lib/auditLogger').then(({ logActivity }) => {
                logActivity('SIGN_UP', `Direct site registration completed`, newProfile);
              });

            } catch (err) {
              console.error("Auth profile creation error:", err);
            }
            setLoading(false);
          }
        }, (error) => {
          console.error("Auth profile snapshots error:", error);
          setLoading(false);
        });
      } else {
        // Audit Log: On user logout
        const wasLoggedIn = sessionStorage.getItem('ahh_login_logged');
        if (wasLoggedIn === 'true') {
          sessionStorage.removeItem('ahh_login_logged');
          import('../lib/auditLogger').then(({ logActivity }) => {
            logActivity('LOGOUT', `User session ended safely.`, null);
          });
        }
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) {
        unsubProfile();
      }
    };
  }, []);

  // Sync profile wishlist array into localStorage so heart buttons immediately highlight
  useEffect(() => {
    if (profile && Array.isArray(profile.wishlist)) {
      try {
        localStorage.setItem('ahh_favorites', JSON.stringify(profile.wishlist));
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.error("Failed syncing profile wishlist to localStorage:", err);
      }
    }
  }, [profile?.wishlist]);

  return (
    <AuthContext.Provider value={{ user, loading, profile, isAuthModalOpen, setIsAuthModalOpen }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
