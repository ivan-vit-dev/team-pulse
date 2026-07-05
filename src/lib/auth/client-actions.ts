"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";

import { auth, googleAuthProvider } from "@/lib/firebase/client";
import type { AppLocale } from "@/i18n/routing";

async function establishServerSession(
  user: User,
  locale: AppLocale,
  displayName?: string,
): Promise<void> {
  const idToken = await user.getIdToken();
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, locale, displayName }),
  });
  if (!response.ok) {
    throw new Error("Failed to establish session");
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  locale: AppLocale,
): Promise<void> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  // Passed through to the session route explicitly rather than relying on
  // the ID token's `name` claim: Firebase caches that token and won't
  // reissue it just because updateProfile() below ran, so the claim would
  // still read empty on the very next request.
  await updateProfile(credential.user, { displayName });
  await establishServerSession(credential.user, locale, displayName);
}

export async function signInWithEmail(
  email: string,
  password: string,
  locale: AppLocale,
): Promise<void> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await establishServerSession(credential.user, locale);
}

export async function signInWithGoogle(locale: AppLocale): Promise<void> {
  const credential = await signInWithPopup(auth, googleAuthProvider);
  await establishServerSession(credential.user, locale);
}

export async function signOutClient(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE" });
  await signOut(auth);
}
