"use server";

import { z } from "zod";

import {
  getAction,
  likeAction,
  listPastActionsForSeasonPage,
  PAST_ACTIONS_PAGE_SIZE,
  unlikeAction,
  type ActionPageCursor,
} from "@/lib/actions/action-repository";
import { requireUid } from "@/lib/auth/require-uid";
import {
  createComment,
  deleteComment,
  getComment,
  setCommentPinned,
} from "@/lib/comments/comment-repository";
import { getTeam, isTeamAdmin } from "@/lib/teams/team-repository";
import type { Action } from "@/lib/types/action";
import type { Comment } from "@/lib/types/comment";
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

export async function likeActionAction(actionId: string): Promise<void> {
  const uid = await requireUid();
  const action = await getAction(actionId);
  if (!action) throw new Error("Action not found");
  await likeAction(actionId, uid);
}

export async function unlikeActionAction(actionId: string): Promise<void> {
  const uid = await requireUid();
  await unlikeAction(actionId, uid);
}

const commentTextSchema = z.string().trim().min(1).max(500);

export type ClientComment = Omit<Comment, "createdAt" | "updatedAt">;

export async function createCommentAction(
  actionId: string,
  teamId: string,
  text: string,
): Promise<ClientComment> {
  const uid = await requireUid();
  const parsedText = commentTextSchema.parse(text);
  const profile = await getUserProfile(uid);
  if (!profile) throw new Error("User profile not found");
  const commentId = await createComment(
    actionId,
    teamId,
    uid,
    profile.displayName,
    profile.photoURL,
    parsedText,
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
