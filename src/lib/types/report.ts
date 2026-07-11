import type { Timestamp } from "firebase-admin/firestore";

export type ReportContentType = "comment" | "media" | "team" | "player";

export type ReportReason =
  | "spam"
  | "harassment"
  | "inappropriate_content"
  | "impersonation"
  | "other";

export type ReportStatus = "pending" | "resolved" | "dismissed";

/** What a resolving admin actually did, for a lightweight audit trail. */
export type ReportResolutionAction = "content_removed" | "none";

export interface Report {
  id: string;
  contentType: ReportContentType;
  /**
   * The id of the reported document itself: a commentId, mediaId, or
   * playerId — or, for contentType "team", the teamId itself (contentId ===
   * teamId in that one case, there's no separate content doc to point at).
   */
  contentId: string;
  /**
   * Owning team id, always derived server-side from the reported content's
   * own record — never trusted from the client. Lets a team's admins list
   * "reports against my team" with one where() query.
   */
  teamId: string;
  reporterUid: string;
  reason: ReportReason;
  /** Optional free-text elaboration, trimmed, max 500 chars, null if omitted. */
  details: string | null;
  status: ReportStatus;
  resolvedByUid: string | null;
  resolvedAt: Timestamp | null;
  resolutionAction: ReportResolutionAction | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
