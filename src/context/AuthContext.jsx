import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, ADMIN_EMAIL } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.email === ADMIN_EMAIL;

  // Слушаем изменения auth состояния
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) {
          setProfile(snap.data());
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const register = async ({ name, email, password }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const userData = {
      uid: cred.user.uid,
      name,
      email,
      avatar: '',
      bio: '',
      currentStage: 0,
      completedStages: [],
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), userData);
    setProfile(userData);
    return cred.user;
  };

  const login = async ({ email, password }) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (snap.exists()) setProfile(snap.data());
    return cred.user;
  };

  const logout = () => signOut(auth);

  const refreshProfile = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) setProfile(snap.data());
  };

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, register, login, logout, refreshProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
