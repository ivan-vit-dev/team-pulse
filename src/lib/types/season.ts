import type { Timestamp } from "firebase-admin/firestore";

export interface Season {
  id: string;
  teamId: string;
  /** Free-text label, e.g. "2025/26". Not parsed or validated as a date range. */
  name: string;
  /** ISO date string (yyyy-mm-dd), same convention as Action.date. Null when
   *  the admin left it blank (and on docs from before date bounds existed —
   *  reads default it to null). */
  startDate: string | null;
  endDate: string | null;
  /** Exactly one season per team may be true — enforced in season-repository.setActiveSeason. */
  isActive: boolean;
  /** Archived (closed) seasons stay browsable in the timeline but are closed
   *  for new content: creating/editing actions in them is blocked and they
   *  can't be set active. Archiving the active season also deactivates it.
   *  Docs from before the lifecycle existed have no field — reads default it
   *  to false. */
  isArchived: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
