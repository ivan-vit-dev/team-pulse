import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminFirestore } from "@/lib/firebase/admin";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type SupportedLocale,
  type UserProfile,
} from "@/lib/types/user";

const usersCollection = adminFirestore.collection("users");

interface EnsureUserProfileInput {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string | null;
  locale: SupportedLocale;
}

/**
 * Idempotently creates the user's profile doc on first sign-in (email/password
 * registration or first-time Google sign-in share this single code path — see
 * CLAUDE.md for why this isn't a Cloud Functions onCreate trigger).
 */
export async function ensureUserProfile(
  input: EnsureUserProfileInput,
): Promise<void> {
  const ref = usersCollection.doc(input.uid);
  const snapshot = await ref.get();

  if (snapshot.exists) {
    // Keep auth-provider-sourced fields fresh without clobbering user edits
    // (e.g. a custom displayName/avatar set on the settings page).
    await ref.set(
      {
        email: input.email,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return;
  }

  const newProfile: Omit<UserProfile, "createdAt" | "updatedAt"> = {
    uid: input.uid,
    email: input.email,
    displayName: input.displayName,
    photoURL: input.photoURL,
    locale: input.locale,
    notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
    followedTeamIds: [],
    role: "fan",
  };

  await ref.set({
    ...newProfile,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await usersCollection.doc(uid).get();
  if (!snapshot.exists) {
    return null;
  }
  return snapshot.data() as UserProfile;
}

export interface UpdateUserProfileInput {
  displayName?: string;
  photoURL?: string | null;
  locale?: SupportedLocale;
  notificationPreferences?: Partial<UserProfile["notificationPreferences"]>;
}

export async function updateUserProfile(
  uid: string,
  input: UpdateUserProfileInput,
): Promise<void> {
  const ref = usersCollection.doc(uid);
  const update: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (input.displayName !== undefined) update.displayName = input.displayName;
  if (input.photoURL !== undefined) update.photoURL = input.photoURL;
  if (input.locale !== undefined) update.locale = input.locale;
  if (input.notificationPreferences !== undefined) {
    const current = await ref.get();
    const currentPrefs =
      (current.data() as UserProfile | undefined)?.notificationPreferences ??
      DEFAULT_NOTIFICATION_PREFERENCES;
    update.notificationPreferences = {
      ...currentPrefs,
      ...input.notificationPreferences,
    };
  }

  await ref.set(update, { merge: true });
}
