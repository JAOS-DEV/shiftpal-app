import { getFirebase } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { auth } = getFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return () => unsub();
  }, [auth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      async signInWithEmail(email: string, password: string) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      async signUpWithEmail(email: string, password: string) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      },
      async signOutUser() {
        await signOut(auth);
      },
    }),
    [auth, user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
