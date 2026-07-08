"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";
import { connectStorageEmulator, getStorage } from "firebase/storage";

import { firebaseClientConfig, useFirebaseEmulators } from "./config";

const app = getApps().length ? getApp() : initializeApp(firebaseClientConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Emulator connections must only ever be attempted once per module load —
// Firebase throws if you call connect*Emulator twice (e.g. on client-side
// route navigation re-executing this module in dev via Fast Refresh).
declare global {
  var __teamPulseEmulatorsConnected: boolean | undefined;
}

if (useFirebaseEmulators && !globalThis.__teamPulseEmulatorsConnected) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  globalThis.__teamPulseEmulatorsConnected = true;
}

// Unlike auth/firestore/storage, messaging can throw in environments that
// don't support it (Safari, non-HTTPS, no service worker support) — so it's
// a lazy, guarded getter rather than an eager module-level export.
let messagingInstance: Messaging | null | undefined;

export async function getFcmMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  if (messagingInstance !== undefined) return messagingInstance;
  messagingInstance = (await isSupported()) ? getMessaging(app) : null;
  return messagingInstance;
}
