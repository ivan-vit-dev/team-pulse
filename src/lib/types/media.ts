import type { Timestamp } from "firebase-admin/firestore";

export type MediaKind = "image" | "videoLink";

export interface Media {
  id: string;
  actionId: string;
  teamId: string;
  /** Docs written before video-link support have no `kind` — reads default it to "image". */
  kind: MediaKind;
  /** kind "image": a Storage download URL. kind "videoLink": the external
   *  video page URL (YouTube/Vimeo only — validated by getVideoEmbedUrl). */
  url: string;
  /** Docs written before pinning support have no `isPinned` — reads default it to false. */
  isPinned: boolean;
  uploadedBy: string;
  createdAt: Timestamp;
}
