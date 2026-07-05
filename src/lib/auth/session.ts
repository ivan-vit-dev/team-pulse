import "server-only";

import { cookies } from "next/headers";

import { adminAuth } from "@/lib/firebase/admin";
import { getUserProfile } from "@/lib/users/user-repository";
import type { UserProfile } from "@/lib/types/user";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "__session";
const SESSION_COOKIE_MAX_AGE_SECONDS = Number(
  process.env.SESSION_COOKIE_MAX_AGE_SECONDS ?? 60 * 60 * 24 * 14,
);

export async function createSessionCookie(idToken: string): Promise<string> {
  return adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_COOKIE_MAX_AGE_SECONDS * 1000,
  });
}

export async function setSessionCookie(sessionCookie: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Verifies the session cookie against Firebase Auth. Returns null for any
 * missing/invalid/expired/revoked cookie rather than throwing — callers
 * should treat that uniformly as "not signed in".
 */
export async function getVerifiedUid(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const uid = await getVerifiedUid();
  if (!uid) {
    return null;
  }
  return getUserProfile(uid);
}

export { SESSION_COOKIE_NAME };
