"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, useEffect, useState, type ReactNode } from "react";

import { auth } from "@/lib/firebase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

/**
 * Reactive client-side auth state for UX only (e.g. instant navbar updates
 * without a full page reload). The server session cookie — not this — is
 * the source of truth for protected routes; see src/lib/auth/session.ts.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
