import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getMessaging, type BatchResponse } from "firebase-admin/messaging";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

initializeApp();
const db = getFirestore();

interface ActionDoc {
  teamId: string;
  type: string;
  title: string;
  createdBy: string;
}

interface UserDoc {
  notificationPreferences?: { push?: boolean };
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

// In-app notifications are an always-on channel, independent of the FCM push
// opt-in above: every follower gets a persisted users/{uid}/notifications/{id}
// doc regardless of notificationPreferences.push, so someone without (or who
// denied) push permission still has something to check in the app.
async function writeInAppNotifications(
  followerUids: string[],
  teamId: string,
  teamName: string,
  actionId: string,
  action: ActionDoc,
): Promise<void> {
  if (followerUids.length === 0) return;
  const batch = db.batch();
  for (const uid of followerUids) {
    const ref = db.collection("users").doc(uid).collection("notifications").doc();
    batch.set(ref, {
      type: "newAction",
      teamId,
      teamName,
      actionId,
      actionType: action.type,
      actionTitle: action.title,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
}

export const onActionCreated = onDocumentCreated("actions/{actionId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const action = snapshot.data() as ActionDoc;

  const followers = await db
    .collection("users")
    .where("followedTeamIds", "array-contains", action.teamId)
    .get();

  const followerUids: string[] = [];
  const tokenOwners = new Map<string, string>();
  const tokens: string[] = [];
  followers.docs.forEach((doc: QueryDocumentSnapshot) => {
    if (doc.id === action.createdBy) return; // skip notifying the creator
    followerUids.push(doc.id);
    const user = doc.data() as UserDoc;
    if (!user.notificationPreferences?.push) return;
    for (const token of user.fcmTokens ?? []) {
      tokens.push(token);
      tokenOwners.set(token, doc.id);
    }
  });

  const team = await db.collection("teams").doc(action.teamId).get();
  const teamName = (team.data()?.name as string | undefined) ?? "TeamPulse";

  try {
    await writeInAppNotifications(followerUids, action.teamId, teamName, event.params.actionId, action);
  } catch (err) {
    console.error("onActionCreated: writing in-app notifications failed:", err);
  }

  if (tokens.length === 0) return;

  try {
    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: teamName,
        body: `New ${action.type}: ${action.title}`,
      },
      data: {
        url: `/teams/${action.teamId}/actions/${event.params.actionId}`,
      },
    });

    await pruneInvalidTokens(tokens, tokenOwners, response);
  } catch (err) {
    console.error("onActionCreated: FCM push failed:", err);
  }
});
