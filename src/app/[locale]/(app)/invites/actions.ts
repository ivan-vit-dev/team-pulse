"use server";

import { requireUid } from "@/lib/auth/require-uid";
import { getCurrentUser } from "@/lib/auth/session";
import {
  acceptInvite as acceptInviteRepo,
  declineInvite as declineInviteRepo,
  getInvite,
} from "@/lib/teams/admin-invite-repository";

async function requireOwnInvite(inviteId: string): Promise<{ uid: string; inviteId: string }> {
  const uid = await requireUid();
  const [invite, user] = await Promise.all([getInvite(inviteId), getCurrentUser()]);
  if (!invite || !user || invite.invitedEmail !== user.email) {
    throw new Error("This invite doesn't belong to you");
  }
  return { uid, inviteId };
}

export async function acceptInviteAction(inviteId: string) {
  const { uid } = await requireOwnInvite(inviteId);
  await acceptInviteRepo(inviteId, uid);
}

export async function declineInviteAction(inviteId: string) {
  await requireOwnInvite(inviteId);
  await declineInviteRepo(inviteId);
}
