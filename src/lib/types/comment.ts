import type { Timestamp } from "firebase-admin/firestore";

export interface Comment {
  id: string;
  actionId: string;
  /** Denormalized so admin checks don't need a second lookup. */
  teamId: string;
  authorUid: string;
  /** Snapshotted at post time, same reasoning as not doing per-comment profile joins elsewhere. */
  authorDisplayName: string;
  authorPhotoURL: string | null;
  text: string;
  isPinned: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
