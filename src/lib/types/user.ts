import type { Timestamp } from "firebase-admin/firestore";

export type SupportedLocale = "en" | "cs";

export type NotificationCategory =
  | "newAction"
  | "actionUpdated"
  | "adminInvite"
  | "commentReply"
  | "followInvite";

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  /** Per-category opt-out, independent of the email/push channel switches above.
   *  Docs written before this field existed lack it entirely — always read via
   *  `prefs.categories?.[category] ?? true`, never assume it's present. */
  categories: Record<NotificationCategory, boolean>;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string | null;
  locale: SupportedLocale;
  notificationPreferences: NotificationPreferences;
  /** Teams this user follows — mutated via followTeam/unfollowTeam in
   * user-repository.ts, and by acceptFollowInviteAction on invite accept. */
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
  categories: {
    newAction: true,
    actionUpdated: true,
    adminInvite: true,
    commentReply: true,
    followInvite: true,
  },
};
