"use server";

import { z } from "zod";

import {
  getAction,
  listPastActionsForSeasonPage,
  PAST_ACTIONS_PAGE_SIZE,
  setReaction,
  type ActionPageCursor,
} from "@/lib/actions/action-repository";
import { requireUid } from "@/lib/auth/require-uid";
import {
  createComment,
  deleteComment,
  getComment,
  setCommentPinned,
} from "@/lib/comments/comment-repository";
import { getMedia } from "@/lib/media/media-repository";
import { getPlayerPublic } from "@/lib/players/player-repository";
import { createReport } from "@/lib/reports/report-repository";
import { getTeam, isTeamAdmin } from "@/lib/teams/team-repository";
import type { Action, ReactionType } from "@/lib/types/action";
import type { Comment } from "@/lib/types/comment";
import type { ReportContentType } from "@/lib/types/report";
import { followTeam, getUserProfile, unfollowTeam } from "@/lib/users/user-repository";
import { omit } from "@/lib/utils/omit";

export interface ClientActionPage {
  actions: Omit<Action, "createdAt" | "updatedAt">[];
  nextCursor: ActionPageCursor | null;
}

// Public read passthrough — no admin check needed, actions are world-readable
// per firestore.rules, same trust level as loading the page itself. Strips
// Timestamp fields before returning: a Server Action's return value crosses
// the client boundary the same way Server Component props do.
export async function loadMorePastActionsAction(
  seasonId: string,
  cursor: ActionPageCursor,
): Promise<ClientActionPage> {
  const page = await listPastActionsForSeasonPage(seasonId, {
    pageSize: PAST_ACTIONS_PAGE_SIZE,
    cursor,
  });
  return {
    actions: page.actions.map((action) => omit(action, "createdAt", "updatedAt")),
    nextCursor: page.nextCursor,
  };
}

export async function followTeamAction(teamId: string): Promise<void> {
  const uid = await requireUid();
  const team = await getTeam(teamId);
  if (!team) throw new Error("Team not found");
  await followTeam(uid, teamId);
}

export async function unfollowTeamAction(teamId: string): Promise<void> {
  const uid = await requireUid();
  await unfollowTeam(uid, teamId);
}

export async function setReactionAction(
  actionId: string,
  type: ReactionType | null,
): Promise<void> {
  const uid = await requireUid();
  const action = await getAction(actionId);
  if (!action) throw new Error("Action not found");
  await setReaction(actionId, uid, type);
}

const commentTextSchema = z.string().trim().min(1).max(500);

export type ClientComment = Omit<Comment, "createdAt" | "updatedAt">;

export async function createCommentAction(
  actionId: string,
  teamId: string,
  text: string,
  parentCommentId: string | null = null,
): Promise<ClientComment> {
  const uid = await requireUid();
  const parsedText = commentTextSchema.parse(text);
  const profile = await getUserProfile(uid);
  if (!profile) throw new Error("User profile not found");

  // Don't trust a client-supplied parentCommentId blindly — same posture as
  // resolveTeamIdForReportedContent below: verify it actually belongs to this
  // action before writing, so a reply can't be mis-attached to someone else's
  // thread on a different action.
  if (parentCommentId) {
    const parent = await getComment(parentCommentId);
    if (!parent || parent.actionId !== actionId) {
      throw new Error("Parent comment not found on this action");
    }
  }

  const commentId = await createComment(
    actionId,
    teamId,
    uid,
    profile.displayName,
    profile.photoURL,
    parsedText,
    parentCommentId,
  );
  const comment = await getComment(commentId);
  if (!comment) throw new Error("Comment not found after creation");
  return omit(comment, "createdAt", "updatedAt");
}

export async function deleteCommentAction(commentId: string): Promise<void> {
  const uid = await requireUid();
  const comment = await getComment(commentId);
  if (!comment) throw new Error("Comment not found");
  const isAuthor = comment.authorUid === uid;
  const isAdmin = await isTeamAdmin(comment.teamId, uid);
  if (!isAuthor && !isAdmin) throw new Error("Not allowed to delete this comment");
  await deleteComment(commentId);
}

export async function pinCommentAction(commentId: string): Promise<void> {
  const uid = await requireUid();
  const comment = await getComment(commentId);
  if (!comment) throw new Error("Comment not found");
  if (!(await isTeamAdmin(comment.teamId, uid))) throw new Error("Not an admin of this team");
  await setCommentPinned(commentId, true);
}

export async function unpinCommentAction(commentId: string): Promise<void> {
  const uid = await requireUid();
  const comment = await getComment(commentId);
  if (!comment) throw new Error("Comment not found");
  if (!(await isTeamAdmin(comment.teamId, uid))) throw new Error("Not an admin of this team");
  await setCommentPinned(commentId, false);
}

const reportContentTypeSchema = z.enum(["comment", "media", "team", "player"]);
const reportReasonSchema = z.enum([
  "spam",
  "harassment",
  "inappropriate_content",
  "impersonation",
  "other",
]);
const reportInputSchema = z.object({
  reason: reportReasonSchema,
  details: z.string().trim().max(500).optional(),
});

async function resolveTeamIdForReportedContent(
  contentType: ReportContentType,
  contentId: string,
): Promise<string | null> {
  switch (contentType) {
    case "comment":
      return (await getComment(contentId))?.teamId ?? null;
    case "media":
      return (await getMedia(contentId))?.teamId ?? null;
    case "player":
      return (await getPlayerPublic(contentId))?.teamId ?? null;
    case "team":
      return (await getTeam(contentId))?.id ?? null;
  }
}

/**
 * teamId is intentionally NOT a parameter here — trusting a client-supplied
 * teamId would let a caller file a report that displays under a team it
 * doesn't actually belong to. The real owning team is looked up server-side
 * from the reported content's own record instead, the same pattern
 * updatePlayerAction/deletePlayerAction use in admin/actions.ts.
 */
export async function reportContentAction(
  contentType: z.infer<typeof reportContentTypeSchema>,
  contentId: string,
  input: z.infer<typeof reportInputSchema>,
): Promise<{ reportId: string }> {
  const uid = await requireUid();
  const parsedType = reportContentTypeSchema.parse(contentType);
  const { reason, details } = reportInputSchema.parse(input);

  const teamId = await resolveTeamIdForReportedContent(parsedType, contentId);
  if (!teamId) throw new Error("Content not found");

  const reportId = await createReport({
    contentType: parsedType,
    contentId,
    teamId,
    reporterUid: uid,
    reason,
    details: details && details.length > 0 ? details : null,
  });
  return { reportId };
}
