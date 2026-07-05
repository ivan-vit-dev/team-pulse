import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminFirestore } from "@/lib/firebase/admin";
import { computeIsYouth } from "@/lib/players/youth";
import type { PlayerPrivate, PlayerPublic, PlayerWithPrivate } from "@/lib/types/player";

const playersCollection = adminFirestore.collection("players");

function privateDoc(playerId: string) {
  return playersCollection.doc(playerId).collection("private").doc("profile");
}

export interface PlayerInput {
  displayName: string;
  jerseyNumber: number | null;
  realName: string;
  birthdate: string;
  /** Ignored (forced to null) when the computed age is under the youth threshold. */
  avatarURL: string | null;
}

export async function createPlayer(teamId: string, input: PlayerInput): Promise<string> {
  const isYouth = computeIsYouth(input.birthdate);
  const ref = playersCollection.doc();
  const batch = adminFirestore.batch();

  const publicData: Omit<PlayerPublic, "id" | "createdAt" | "updatedAt"> = {
    teamId,
    displayName: input.displayName,
    jerseyNumber: input.jerseyNumber,
    isYouth,
    avatarURL: isYouth ? null : input.avatarURL,
  };
  batch.set(ref, {
    ...publicData,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const privateData: Omit<PlayerPrivate, "updatedAt"> = {
    realName: input.realName,
    birthdate: input.birthdate,
  };
  batch.set(privateDoc(ref.id), {
    ...privateData,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
  return ref.id;
}

export async function getPlayerPublic(playerId: string): Promise<PlayerPublic | null> {
  const snapshot = await playersCollection.doc(playerId).get();
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() } as PlayerPublic;
}

/** Admin-only: caller must verify isTeamAdmin() before calling this. */
export async function getPlayerWithPrivate(playerId: string): Promise<PlayerWithPrivate | null> {
  const [publicSnap, privateSnap] = await Promise.all([
    playersCollection.doc(playerId).get(),
    privateDoc(playerId).get(),
  ]);
  if (!publicSnap.exists || !privateSnap.exists) return null;
  const publicData = { id: publicSnap.id, ...publicSnap.data() } as PlayerPublic;
  const privateData = privateSnap.data() as PlayerPrivate;
  return { ...publicData, realName: privateData.realName, birthdate: privateData.birthdate };
}

export async function listPlayersForTeam(teamId: string): Promise<PlayerPublic[]> {
  const snapshot = await playersCollection.where("teamId", "==", teamId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as PlayerPublic);
}

/** Admin-only: caller must verify isTeamAdmin() before calling this. */
export async function listPlayersForTeamWithPrivate(
  teamId: string,
): Promise<PlayerWithPrivate[]> {
  const publicPlayers = await listPlayersForTeam(teamId);
  const privateSnaps = await Promise.all(
    publicPlayers.map((player) => privateDoc(player.id).get()),
  );
  return publicPlayers.map((player, i) => {
    const privateData = privateSnaps[i]!.data() as PlayerPrivate | undefined;
    return {
      ...player,
      realName: privateData?.realName ?? "",
      birthdate: privateData?.birthdate ?? "",
    };
  });
}

export async function updatePlayer(playerId: string, input: PlayerInput): Promise<void> {
  const isYouth = computeIsYouth(input.birthdate);
  const batch = adminFirestore.batch();

  batch.set(
    playersCollection.doc(playerId),
    {
      displayName: input.displayName,
      jerseyNumber: input.jerseyNumber,
      isYouth,
      avatarURL: isYouth ? null : input.avatarURL,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  batch.set(
    privateDoc(playerId),
    {
      realName: input.realName,
      birthdate: input.birthdate,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await batch.commit();
}

export async function updatePlayerAvatar(playerId: string, avatarURL: string): Promise<void> {
  await playersCollection.doc(playerId).set(
    { avatarURL, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}

export async function deletePlayer(playerId: string): Promise<void> {
  const batch = adminFirestore.batch();
  batch.delete(playersCollection.doc(playerId));
  batch.delete(privateDoc(playerId));
  await batch.commit();
}
