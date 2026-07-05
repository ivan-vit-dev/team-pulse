import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { useFirebaseEmulators } from "@/lib/firebase/config";

// The Admin SDK's underlying Firestore/Auth clients auto-detect
// FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST / etc.
// unconditionally — a Google Cloud client library convention that ignores
// our own useFirebaseEmulators flag entirely. If those vars are left over
// in .env.local from a previous emulator session, every Admin SDK call
// would silently redirect to a (likely unreachable) local emulator instead
// of the real project. Clearing them here makes useFirebaseEmulators the
// single source of truth regardless of what's left in the environment.
if (!useFirebaseEmulators) {
  delete process.env.FIRESTORE_EMULATOR_HOST;
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  delete process.env.FIREBASE_STORAGE_EMULATOR_HOST;
}

function buildAdminApp(): App {
  if (getApps().length) {
    return getApps()[0]!;
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    return initializeApp({ credential: cert(JSON.parse(serviceAccountKey)) });
  }

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (clientEmail && privateKey) {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }

  // Local Emulator Suite: FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST
  // let the Admin SDK skip real credentials entirely — a project id is enough.
  return initializeApp({ projectId });
}

const adminApp = buildAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);
