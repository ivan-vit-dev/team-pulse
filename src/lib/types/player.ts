import type { Timestamp } from "firebase-admin/firestore";

/**
 * Public-safe player fields — readable by anyone. Never place realName,
 * birthdate, or an unrestricted avatar here; Firestore has no field-level
 * read security, so anything on this document is world-readable the moment
 * `players/{playerId}` is readable. See PlayerPrivate for the admin-only
 * fields, stored in a separate document specifically so the security
 * boundary is a document boundary, not a field one.
 */
export interface PlayerPublic {
  id: string;
  teamId: string;
  /** Pseudonym for youth players; real name for adults is fine here too. */
  displayName: string;
  jerseyNumber: number | null;
  isYouth: boolean;
  /** Must be null when isYouth is true — enforced at write time. */
  avatarURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Stored at players/{playerId}/private/profile — admin-only. */
export interface PlayerPrivate {
  realName: string;
  /** ISO date string (yyyy-mm-dd). */
  birthdate: string;
  updatedAt: Timestamp;
}

export interface PlayerWithPrivate extends PlayerPublic {
  realName: string;
  birthdate: string;
}
