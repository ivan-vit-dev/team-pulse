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
