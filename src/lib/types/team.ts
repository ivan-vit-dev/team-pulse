import type { Timestamp } from "firebase-admin/firestore";

export interface TeamColors {
  primary: string;
  secondary: string;
}

export interface TeamSocialLinks {
  website?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
}

export interface Team {
  id: string;
  name: string;
  category: string;
  club: string | null;
  location: string;
  homePitch: string;
  logoURL: string | null;
  colors: TeamColors | null;
  socialLinks: TeamSocialLinks;
  /** UIDs of users who administer this team. Always includes the creator. */
  adminUids: string[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type AdminInviteStatus = "pending" | "accepted" | "declined";

export interface AdminInvite {
  id: string;
  teamId: string;
  invitedEmail: string;
  invitedByUid: string;
  status: AdminInviteStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Fan-facing parallel to AdminInvite — accepting calls followTeam, not
// addTeamAdmin. Kept as a separate collection/type rather than a variant of
// AdminInvite so the two invite kinds (admin rights vs. just following) can
// never be confused at the rules/repository layer.
export type FollowInviteStatus = "pending" | "accepted" | "declined";

export interface FollowInvite {
  id: string;
  teamId: string;
  invitedEmail: string;
  invitedByUid: string;
  status: FollowInviteStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
