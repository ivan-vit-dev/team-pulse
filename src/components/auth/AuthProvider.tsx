"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { onMessage } from "firebase/messaging";
import { createContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { auth, getFcmMessaging } from "@/lib/firebase/client";

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
  const router = useRouter();

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    getFcmMessaging().then((messaging) => {
      if (!messaging) return;
      unsubscribe = onMessage(messaging, (payload) => {
        const url = payload.data?.url;
        toast(payload.notification?.title ?? "TeamPulse", {
          description: payload.notification?.body,
          action: url ? { label: "View", onClick: () => router.push(url) } : undefined,
        });
      });
    });
    return () => unsubscribe?.();
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
