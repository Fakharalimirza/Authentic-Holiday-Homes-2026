import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: any | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, profile: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setUser(user);
      try {
        if (user) {
          console.log("Auth: Fetching profile for", user.uid, user.email);
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            console.log("Auth: Profile not found, creating...");
            // Create initial profile
            const newProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || 'Guest',
              role: user.email?.toLowerCase() === 'fakharalimirza@gmail.com' ? 'host' : 'guest',
              createdAt: serverTimestamp(),
              wishlist: []
            };
            await setDoc(doc(db, 'users', user.uid), newProfile);
            setProfile({ ...newProfile, createdAt: new Date().toISOString() } as any);
          } else {
            const data = userDoc.data();
            console.log("Auth: Profile found", data.role);
            // Ensure admin email always has host role
            if (user.email?.toLowerCase() === 'fakharalimirza@gmail.com' && data.role !== 'host') {
              console.log("Auth: Upgrading admin to host role");
              data.role = 'host';
              await setDoc(doc(db, 'users', user.uid), { ...data, role: 'host' }, { merge: true });
            }
            setProfile(data);
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth profile fetch error:", err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, profile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
