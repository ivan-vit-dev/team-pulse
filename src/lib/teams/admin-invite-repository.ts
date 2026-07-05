import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminFirestore } from "@/lib/firebase/admin";
import { addTeamAdmin } from "@/lib/teams/team-repository";
import type { AdminInvite } from "@/lib/types/team";

const invitesCollection = adminFirestore.collection("teamAdminInvites");

export async function createInvite(
  teamId: string,
  invitedEmail: string,
  invitedByUid: string,
): Promise<string> {
  const existing = await invitesCollection
    .where("teamId", "==", teamId)
    .where("invitedEmail", "==", invitedEmail)
    .where("status", "==", "pending")
    .limit(1)
    .get();
  if (!existing.empty) {
    return existing.docs[0]!.id;
  }

  const ref = invitesCollection.doc();
  await ref.set({
    teamId,
    invitedEmail,
    invitedByUid,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getInvite(inviteId: string): Promise<AdminInvite | null> {
  const snapshot = await invitesCollection.doc(inviteId).get();
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() } as AdminInvite;
}

export async function listInvitesForTeam(teamId: string): Promise<AdminInvite[]> {
  const snapshot = await invitesCollection.where("teamId", "==", teamId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AdminInvite);
}

export async function listPendingInvitesForEmail(email: string): Promise<AdminInvite[]> {
  const snapshot = await invitesCollection
    .where("invitedEmail", "==", email)
    .where("status", "==", "pending")
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AdminInvite);
}

/** Caller must verify the invite's invitedEmail matches the acting user's own email. */
export async function acceptInvite(inviteId: string, acceptingUid: string): Promise<void> {
  const invite = await getInvite(inviteId);
  if (!invite || invite.status !== "pending") {
    throw new Error("Invite is no longer pending");
  }
  await invitesCollection.doc(inviteId).set(
    { status: "accepted", updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  await addTeamAdmin(invite.teamId, acceptingUid);
}

export async function declineInvite(inviteId: string): Promise<void> {
  await invitesCollection.doc(inviteId).set(
    { status: "declined", updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}

export async function revokeInvite(inviteId: string): Promise<void> {
  await invitesCollection.doc(inviteId).delete();
}
