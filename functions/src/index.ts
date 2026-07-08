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

export const onActionCreated = onDocumentCreated("actions/{actionId}", async (event) => {
  try {
    const snapshot = event.data;
    if (!snapshot) return;
    const action = snapshot.data() as ActionDoc;

    const followers = await db
      .collection("users")
      .where("followedTeamIds", "array-contains", action.teamId)
      .get();

    const tokenOwners = new Map<string, string>();
    const tokens: string[] = [];
    followers.docs.forEach((doc: QueryDocumentSnapshot) => {
      if (doc.id === action.createdBy) return; // skip notifying the creator
      const user = doc.data() as UserDoc;
      if (!user.notificationPreferences?.push) return;
      for (const token of user.fcmTokens ?? []) {
        tokens.push(token);
        tokenOwners.set(token, doc.id);
      }
    });

    if (tokens.length === 0) return;

    const team = await db.collection("teams").doc(action.teamId).get();
    const teamName = (team.data()?.name as string | undefined) ?? "TeamPulse";

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
    console.error("onActionCreated failed:", err);
  }
});
