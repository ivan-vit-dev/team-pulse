import type { Timestamp } from "firebase-admin/firestore";

export interface Comment {
  id: string;
  actionId: string;
  /** Denormalized so admin checks don't need a second lookup. */
  teamId: string;
  /** Single-level threading: a reply-to-a-reply still points at the original
   *  top-level comment's id, not the reply's — never more than one level to
   *  render. Absent on comments created before threading existed; always
   *  read via `comment.parentCommentId ?? null`. */
  parentCommentId: string | null;
  authorUid: string;
  /** Snapshotted at post time, same reasoning as not doing per-comment profile joins elsewhere. */
  authorDisplayName: string;
  authorPhotoURL: string | null;
  text: string;
  isPinned: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
