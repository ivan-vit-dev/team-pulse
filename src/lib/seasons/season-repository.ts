import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import type { DocumentSnapshot } from "firebase-admin/firestore";

import { adminFirestore } from "@/lib/firebase/admin";
import type { Season } from "@/lib/types/season";
import { listActionsForSeason } from "@/lib/actions/action-repository";

const seasonsCollection = adminFirestore.collection("seasons");

export interface SeasonInput {
  name: string;
  startDate: string | null;
  endDate: string | null;
}

// Docs created before date bounds / the archive lifecycle have no
// startDate/endDate/isArchived — default them (defensive read, no migration
// script — see CLAUDE.md).
function toSeason(snapshot: DocumentSnapshot): Season {
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    startDate: null,
    endDate: null,
    isArchived: false,
    ...data,
  } as Season;
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
    startDate: input.startDate,
    endDate: input.endDate,
    // A team's very first season is activated automatically — every one
    // after that requires an explicit setActiveSeason call.
    isActive: existing.length === 0,
    isArchived: false,
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
  return toSeason(snapshot);
}

export async function listSeasonsForTeam(teamId: string): Promise<Season[]> {
  const snapshot = await seasonsCollection.where("teamId", "==", teamId).get();
  return snapshot.docs.map(toSeason);
}

export async function getActiveSeason(teamId: string): Promise<Season | null> {
  const snapshot = await seasonsCollection
    .where("teamId", "==", teamId)
    .where("isActive", "==", true)
    .limit(1)
    .get();
  const doc = snapshot.docs[0];
  return doc ? toSeason(doc) : null;
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
    if ((targetSnap.data() as Season).isArchived === true) {
      throw new Error("Cannot activate an archived season");
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

/** Archiving the active season also deactivates it — an archived season can
 *  never be the team's active one. Unarchiving does NOT reactivate; that's an
 *  explicit setActiveSeason call. */
export async function setSeasonArchived(seasonId: string, isArchived: boolean): Promise<void> {
  await seasonsCollection.doc(seasonId).set(
    {
      isArchived,
      ...(isArchived ? { isActive: false } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
