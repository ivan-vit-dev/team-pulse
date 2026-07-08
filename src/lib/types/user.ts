import type { Timestamp } from "firebase-admin/firestore";

export type SupportedLocale = "en" | "cs";

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string | null;
  locale: SupportedLocale;
  notificationPreferences: NotificationPreferences;
  /** Stub until the Follow System phase ships — always []. */
  followedTeamIds: string[];
  /** Registered FCM web-push tokens, one per browser/device. */
  fcmTokens: string[];
  /** Forward-compat placeholder; 'admin' is introduced in the Team Management phase. */
  role: "fan";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: true,
  push: false,
};
