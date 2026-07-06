import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminFirestore } from "@/lib/firebase/admin";
import type { Season } from "@/lib/types/season";
import { listActionsForSeason } from "@/lib/actions/action-repository";

const seasonsCollection = adminFirestore.collection("seasons");

export interface SeasonInput {
  name: string;
}

export async function createSeason(
  teamId: string,
  input: SeasonInput,
  creatorUid: string,
): Promise<string> {
  const existing = await listSeasonsForTeam(teamId);
  const ref = seasonsCollection.doc();
  const newSeason: Omit<Season, "id" | "createdAt" | "updatedAt"> = {
    teamId,
    name: input.name,
    // A team's very first season is activated automatically — every one
    // after that requires an explicit setActiveSeason call.
    isActive: existing.length === 0,
    createdBy: creatorUid,
  };
  await ref.set({
    ...newSeason,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getSeason(seasonId: string): Promise<Season | null> {
  const snapshot = await seasonsCollection.doc(seasonId).get();
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() } as Season;
}

export async function listSeasonsForTeam(teamId: string): Promise<Season[]> {
  const snapshot = await seasonsCollection.where("teamId", "==", teamId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Season);
}

export async function getActiveSeason(teamId: string): Promise<Season | null> {
  const snapshot = await seasonsCollection
    .where("teamId", "==", teamId)
    .where("isActive", "==", true)
    .limit(1)
    .get();
  const doc = snapshot.docs[0];
  return doc ? ({ id: doc.id, ...doc.data() } as Season) : null;
}

export async function updateSeason(seasonId: string, input: SeasonInput): Promise<void> {
  await seasonsCollection.doc(seasonId).set(
    { ...input, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}

/**
 * Cross-repository call (the only one in this codebase — repositories are
 * otherwise self-contained per collection): a season that still has actions
 * can't be silently orphaned, and that invariant belongs at the write layer
 * rather than duplicated into the Server Action.
 */
export async function deleteSeason(seasonId: string): Promise<void> {
  const actions = await listActionsForSeason(seasonId);
  if (actions.length > 0) {
    throw new Error("Cannot delete a season that still has actions");
  }
  await seasonsCollection.doc(seasonId).delete();
}

/** Atomically unsets any other active season for the team and activates this one. */
export async function setActiveSeason(teamId: string, seasonId: string): Promise<void> {
  await adminFirestore.runTransaction(async (tx) => {
    const targetRef = seasonsCollection.doc(seasonId);
    const targetSnap = await tx.get(targetRef);
    if (!targetSnap.exists || (targetSnap.data() as Season).teamId !== teamId) {
      throw new Error("Season not found for this team");
    }

    const activeSnap = await tx.get(
      seasonsCollection.where("teamId", "==", teamId).where("isActive", "==", true),
    );

    for (const doc of activeSnap.docs) {
      if (doc.id !== seasonId) {
        tx.set(doc.ref, { isActive: false, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }
    }
    tx.set(targetRef, { isActive: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
}
