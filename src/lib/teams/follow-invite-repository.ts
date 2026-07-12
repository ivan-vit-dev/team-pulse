import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminFirestore } from "@/lib/firebase/admin";
import type { FollowInvite } from "@/lib/types/team";
import { followTeam } from "@/lib/users/user-repository";

const followInvitesCollection = adminFirestore.collection("teamFollowInvites");

export async function createInvite(
  teamId: string,
  invitedEmail: string,
  invitedByUid: string,
): Promise<string> {
  const existing = await followInvitesCollection
    .where("teamId", "==", teamId)
    .where("invitedEmail", "==", invitedEmail)
    .where("status", "==", "pending")
    .limit(1)
    .get();
  if (!existing.empty) {
    return existing.docs[0]!.id;
  }

  const ref = followInvitesCollection.doc();
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

export async function getInvite(inviteId: string): Promise<FollowInvite | null> {
  const snapshot = await followInvitesCollection.doc(inviteId).get();
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() } as FollowInvite;
}

export async function listInvitesForTeam(teamId: string): Promise<FollowInvite[]> {
  const snapshot = await followInvitesCollection.where("teamId", "==", teamId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as FollowInvite);
}

export async function listPendingInvitesForEmail(email: string): Promise<FollowInvite[]> {
  const snapshot = await followInvitesCollection
    .where("invitedEmail", "==", email)
    .where("status", "==", "pending")
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as FollowInvite);
}

/** Caller must verify the invite's invitedEmail matches the acting user's own email. */
export async function acceptInvite(inviteId: string, acceptingUid: string): Promise<void> {
  const invite = await getInvite(inviteId);
  if (!invite || invite.status !== "pending") {
    throw new Error("Invite is no longer pending");
  }
  await followInvitesCollection.doc(inviteId).set(
    { status: "accepted", updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  await followTeam(acceptingUid, invite.teamId);
}

export async function declineInvite(inviteId: string): Promise<void> {
  await followInvitesCollection.doc(inviteId).set(
    { status: "declined", updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}

export async function revokeInvite(inviteId: string): Promise<void> {
  await followInvitesCollection.doc(inviteId).delete();
}
