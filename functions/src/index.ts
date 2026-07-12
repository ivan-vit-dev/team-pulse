import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  FieldValue,
  getFirestore,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { getMessaging, type BatchResponse } from "firebase-admin/messaging";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";

initializeApp();
const db = getFirestore();

type NotificationCategory =
  | "newAction"
  | "actionUpdated"
  | "adminInvite"
  | "commentReply"
  | "followInvite";

interface ActionDoc {
  teamId: string;
  type: string;
  title: string;
  opponent?: string | null;
  date: string;
  time: string | null;
  location: string | null;
  competition: string | null;
  isHome: boolean | null;
  result: unknown;
  description?: string | null;
  createdBy: string;
  updatedBy?: string;
}

interface AdminInviteDoc {
  teamId: string;
  invitedEmail: string;
}

interface CommentDoc {
  actionId: string;
  teamId: string;
  parentCommentId: string | null;
  authorUid: string;
  authorDisplayName: string;
  text: string;
}

interface UserDoc {
  notificationPreferences?: {
    push?: boolean;
    categories?: Partial<Record<NotificationCategory, boolean>>;
  };
  fcmTokens?: string[];
}

// Prunes tokens FCM reports as invalid/unregistered — otherwise dead tokens
// (uninstalled browsers, revoked permission) accumulate on a profile forever.
async function pruneInvalidTokens(
  tokens: string[],
  tokenOwners: Map<string, string>,
  response: BatchResponse,
): Promise<void> {
  const invalidByUid = new Map<string, string[]>();
  response.responses.forEach((result, i) => {
    if (result.success) return;
    const code = result.error?.code;
    if (code !== "messaging/invalid-registration-token" && code !== "messaging/registration-token-not-registered") {
      return;
    }
    const token = tokens[i];
    const uid = tokenOwners.get(token);
    if (!uid) return;
    const existing = invalidByUid.get(uid) ?? [];
    existing.push(token);
    invalidByUid.set(uid, existing);
  });

  await Promise.all(
    Array.from(invalidByUid.entries()).map(([uid, invalidTokens]) =>
      db
        .collection("users")
        .doc(uid)
        .update({ fcmTokens: FieldValue.arrayRemove(...invalidTokens) }),
    ),
  );
}

/**
 * Shared fan-out used by every trigger below: writes an always-on in-app
 * users/{uid}/notifications/{id} doc for everyone with `category` enabled
 * (defaulting missing preferences to enabled, since docs written before a
 * category existed lack it entirely), then separately sends FCM push only to
 * the subset who also have the `push` channel switch on. The two channels
 * are independent gates — category controls "notify at all," push controls
 * "...and also push it."
 */
async function notifyUsers(
  userDocs: (QueryDocumentSnapshot | DocumentSnapshot)[],
  category: NotificationCategory,
  buildNotificationDoc: (uid: string) => Record<string, unknown>,
  pushPayload: { title: string; body: string; url: string },
): Promise<void> {
  const inAppUids: string[] = [];
  const tokenOwners = new Map<string, string>();
  const tokens: string[] = [];

  userDocs.forEach((snap) => {
    if (!snap.exists) return;
    const user = snap.data() as UserDoc;
    const categoryEnabled = user.notificationPreferences?.categories?.[category] ?? true;
    if (!categoryEnabled) return;
    inAppUids.push(snap.id);
    if (!user.notificationPreferences?.push) return;
    for (const token of user.fcmTokens ?? []) {
      tokens.push(token);
      tokenOwners.set(token, snap.id);
    }
  });

  if (inAppUids.length > 0) {
    try {
      const batch = db.batch();
      for (const uid of inAppUids) {
        const ref = db.collection("users").doc(uid).collection("notifications").doc();
        batch.set(ref, {
          ...buildNotificationDoc(uid),
          isRead: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    } catch (err) {
      console.error(`notifyUsers[${category}]: writing in-app notifications failed:`, err);
    }
  }

  if (tokens.length === 0) return;

  try {
    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title: pushPayload.title, body: pushPayload.body },
      data: { url: pushPayload.url },
    });
    await pruneInvalidTokens(tokens, tokenOwners, response);
  } catch (err) {
    console.error(`notifyUsers[${category}]: FCM push failed:`, err);
  }
}

export const onActionCreated = onDocumentCreated("actions/{actionId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const action = snapshot.data() as ActionDoc;

  const followers = await db
    .collection("users")
    .where("followedTeamIds", "array-contains", action.teamId)
    .get();
  const recipientDocs = followers.docs.filter((doc) => doc.id !== action.createdBy);
  if (recipientDocs.length === 0) return;

  const team = await db.collection("teams").doc(action.teamId).get();
  const teamName = (team.data()?.name as string | undefined) ?? "TeamPulse";

  await notifyUsers(
    recipientDocs,
    "newAction",
    () => ({
      type: "newAction",
      teamId: action.teamId,
      teamName,
      actionId: event.params.actionId,
      actionType: action.type,
      actionTitle: action.title,
    }),
    {
      title: teamName,
      body: `New ${action.type}: ${action.title}`,
      url: `/teams/${action.teamId}/actions/${event.params.actionId}`,
    },
  );
});

// Fields that materially change what a fan sees on the action — deliberately
// excludes reactions and squadPlayerIds (roster tweaks), which write to this
// same document far more often than the action itself changes.
const MEANINGFUL_ACTION_FIELDS = [
  "title",
  "type",
  "opponent",
  "date",
  "time",
  "location",
  "competition",
  "isHome",
  "result",
  "description",
] as const;

function hasMeaningfulActionChange(before: ActionDoc, after: ActionDoc): boolean {
  return MEANINGFUL_ACTION_FIELDS.some(
    (field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]),
  );
}

export const onActionUpdated = onDocumentUpdated("actions/{actionId}", async (event) => {
  const beforeSnap = event.data?.before;
  const afterSnap = event.data?.after;
  if (!beforeSnap || !afterSnap) return;
  const before = beforeSnap.data() as ActionDoc;
  const after = afterSnap.data() as ActionDoc;

  if (!hasMeaningfulActionChange(before, after)) return;

  const followers = await db
    .collection("users")
    .where("followedTeamIds", "array-contains", after.teamId)
    .get();
  const recipientDocs = followers.docs.filter((doc) => doc.id !== after.updatedBy);
  if (recipientDocs.length === 0) return;

  const team = await db.collection("teams").doc(after.teamId).get();
  const teamName = (team.data()?.name as string | undefined) ?? "TeamPulse";

  await notifyUsers(
    recipientDocs,
    "actionUpdated",
    () => ({
      type: "actionUpdated",
      teamId: after.teamId,
      teamName,
      actionId: event.params.actionId,
      actionType: after.type,
      actionTitle: after.title,
    }),
    {
      title: teamName,
      body: `Updated ${after.type}: ${after.title}`,
      url: `/teams/${after.teamId}/actions/${event.params.actionId}`,
    },
  );
});

// Invites are matched by email, not uid — the invited person may not have an
// account yet (see admin-invite-repository.ts). If there's no matching Auth
// user, there's simply nothing to notify yet; they'll see the pending invite
// once they register, via the app's existing listPendingInvitesForEmail flow.
export const onAdminInviteCreated = onDocumentCreated(
  "teamAdminInvites/{inviteId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const invite = snapshot.data() as AdminInviteDoc;

    let uid: string;
    try {
      const userRecord = await getAuth().getUserByEmail(invite.invitedEmail);
      uid = userRecord.uid;
    } catch {
      return;
    }

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) return;

    const team = await db.collection("teams").doc(invite.teamId).get();
    const teamName = (team.data()?.name as string | undefined) ?? "TeamPulse";

    await notifyUsers(
      [userDoc],
      "adminInvite",
      () => ({
        type: "adminInvite",
        teamId: invite.teamId,
        teamName,
        inviteId: event.params.inviteId,
      }),
      {
        title: teamName,
        body: `You've been invited to help manage ${teamName}`,
        url: "/invites",
      },
    );
  },
);

// Fan-facing parallel to onAdminInviteCreated above — same email-matching and
// graceful no-op for unregistered emails, but reads from teamFollowInvites
// (see follow-invite-repository.ts, which calls followTeam on accept instead
// of addTeamAdmin).
export const onFollowInviteCreated = onDocumentCreated(
  "teamFollowInvites/{inviteId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const invite = snapshot.data() as AdminInviteDoc;

    let uid: string;
    try {
      const userRecord = await getAuth().getUserByEmail(invite.invitedEmail);
      uid = userRecord.uid;
    } catch {
      return;
    }

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) return;

    const team = await db.collection("teams").doc(invite.teamId).get();
    const teamName = (team.data()?.name as string | undefined) ?? "TeamPulse";

    await notifyUsers(
      [userDoc],
      "followInvite",
      () => ({
        type: "followInvite",
        teamId: invite.teamId,
        teamName,
        inviteId: event.params.inviteId,
      }),
      {
        title: teamName,
        body: `You've been invited to follow ${teamName}`,
        url: "/invites",
      },
    );
  },
);

export const onCommentCreated = onDocumentCreated("comments/{commentId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const comment = snapshot.data() as CommentDoc;
  if (!comment.parentCommentId) return; // top-level comment, not a reply

  const parentSnap = await db.collection("comments").doc(comment.parentCommentId).get();
  if (!parentSnap.exists) return;
  const parent = parentSnap.data() as CommentDoc;
  if (parent.authorUid === comment.authorUid) return; // no self-notify

  const userDoc = await db.collection("users").doc(parent.authorUid).get();
  if (!userDoc.exists) return;

  const preview = comment.text.length > 80 ? `${comment.text.slice(0, 80)}…` : comment.text;

  await notifyUsers(
    [userDoc],
    "commentReply",
    () => ({
      type: "commentReply",
      teamId: comment.teamId,
      actionId: comment.actionId,
      commentId: event.params.commentId,
      replierDisplayName: comment.authorDisplayName,
      commentTextPreview: preview,
    }),
    {
      title: `${comment.authorDisplayName} replied to your comment`,
      body: preview,
      url: `/teams/${comment.teamId}/actions/${comment.actionId}`,
    },
  );
});
