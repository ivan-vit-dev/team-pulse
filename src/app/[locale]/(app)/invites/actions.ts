"use server";

import { requireUid } from "@/lib/auth/require-uid";
import { getCurrentUser } from "@/lib/auth/session";
import {
  acceptInvite as acceptInviteRepo,
  declineInvite as declineInviteRepo,
  getInvite,
} from "@/lib/teams/admin-invite-repository";
import {
  acceptInvite as acceptFollowInviteRepo,
  declineInvite as declineFollowInviteRepo,
  getInvite as getFollowInvite,
} from "@/lib/teams/follow-invite-repository";

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

async function requireOwnFollowInvite(inviteId: string): Promise<{ uid: string }> {
  const uid = await requireUid();
  const [invite, user] = await Promise.all([getFollowInvite(inviteId), getCurrentUser()]);
  if (!invite || !user || invite.invitedEmail !== user.email) {
    throw new Error("This invite doesn't belong to you");
  }
  return { uid };
}

export async function acceptFollowInviteAction(inviteId: string) {
  const { uid } = await requireOwnFollowInvite(inviteId);
  await acceptFollowInviteRepo(inviteId, uid);
}

export async function declineFollowInviteAction(inviteId: string) {
  await requireOwnFollowInvite(inviteId);
  await declineFollowInviteRepo(inviteId);
}
