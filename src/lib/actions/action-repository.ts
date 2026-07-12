import "server-only";

import { FieldPath, FieldValue } from "firebase-admin/firestore";

import { adminFirestore } from "@/lib/firebase/admin";
import type { Action, ActionResult, ActionType, ReactionType } from "@/lib/types/action";

const actionsCollection = adminFirestore.collection("actions");

function getTodayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export const PAST_ACTIONS_PAGE_SIZE = 10;

export interface ActionInput {
  type: ActionType;
  title: string;
  opponent: string | null;
  competition: string | null;
  date: string;
  time: string | null;
  location: string | null;
  isHome: boolean | null;
  result: ActionResult | null;
  squadPlayerIds: string[];
  description: string | null;
}

export async function createAction(
  teamId: string,
  seasonId: string,
  input: ActionInput,
  creatorUid: string,
): Promise<string> {
  const ref = actionsCollection.doc();
  const newAction: Omit<Action, "id" | "createdAt" | "updatedAt"> = {
    teamId,
    seasonId,
    ...input,
    reactions: {},
    createdBy: creatorUid,
    updatedBy: creatorUid,
  };
  await ref.set({
    ...newAction,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getAction(actionId: string): Promise<Action | null> {
  const snapshot = await actionsCollection.doc(actionId).get();
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() } as Action;
}

export async function listActionsForSeason(seasonId: string): Promise<Action[]> {
  const snapshot = await actionsCollection.where("seasonId", "==", seasonId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Action);
}

// Unpaginated: a season only ever has a handful of fixtures still ahead of
// it, unlike the past-actions history this page can grow unbounded.
export async function listUpcomingActionsForSeason(seasonId: string): Promise<Action[]> {
  const snapshot = await actionsCollection
    .where("seasonId", "==", seasonId)
    .where("date", ">=", getTodayISODate())
    .orderBy("date", "asc")
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Action);
}

export interface ActionPageCursor {
  date: string;
  id: string;
}

export interface ActionPage {
  actions: Action[];
  nextCursor: ActionPageCursor | null;
}

// documentId() is an explicit tiebreak, not just cosmetic: multiple actions
// can share the same date (e.g. a tournament), and startAfter(date) alone
// would non-deterministically skip or repeat one at a page boundary.
export async function listPastActionsForSeasonPage(
  seasonId: string,
  { pageSize, cursor }: { pageSize: number; cursor?: ActionPageCursor },
): Promise<ActionPage> {
  let query = actionsCollection
    .where("seasonId", "==", seasonId)
    .where("date", "<", getTodayISODate())
    .orderBy("date", "desc")
    .orderBy(FieldPath.documentId(), "desc");
  if (cursor) {
    query = query.startAfter(cursor.date, cursor.id);
  }
  const snapshot = await query.limit(pageSize + 1).get();
  const hasMore = snapshot.docs.length > pageSize;
  const docs = snapshot.docs.slice(0, pageSize);
  const actions = docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Action);
  const last = docs[docs.length - 1];
  return {
    actions,
    nextCursor: hasMore && last ? { date: (last.data() as Action).date, id: last.id } : null,
  };
}

export async function updateAction(
  actionId: string,
  input: ActionInput,
  updatedByUid: string,
): Promise<void> {
  await actionsCollection.doc(actionId).set(
    { ...input, updatedBy: updatedByUid, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}

export async function deleteAction(actionId: string): Promise<void> {
  await actionsCollection.doc(actionId).delete();
}

// A single dot-path field update — switching reaction type is just an
// overwrite (atomic, no read-then-write race), and removing is a field
// delete, not an arrayRemove across two separate per-type arrays.
export async function setReaction(
  actionId: string,
  uid: string,
  type: ReactionType | null,
): Promise<void> {
  await actionsCollection.doc(actionId).update({
    [`reactions.${uid}`]: type === null ? FieldValue.delete() : type,
  });
}
