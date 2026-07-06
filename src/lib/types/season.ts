import type { Timestamp } from "firebase-admin/firestore";

export interface Season {
  id: string;
  teamId: string;
  /** Free-text label, e.g. "2025/26". Not parsed or validated as a date range. */
  name: string;
  /** Exactly one season per team may be true — enforced in season-repository.setActiveSeason. */
  isActive: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
