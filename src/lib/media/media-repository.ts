import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import type { DocumentSnapshot } from "firebase-admin/firestore";

import { adminFirestore } from "@/lib/firebase/admin";
import type { Media, MediaKind } from "@/lib/types/media";

const mediaCollection = adminFirestore.collection("media");

// Docs created before video-link/pinning support have no `kind`/`isPinned` —
// default them (defensive read, no migration script — see CLAUDE.md).
function toMedia(snapshot: DocumentSnapshot): Media {
  const data = snapshot.data() ?? {};
  return { id: snapshot.id, kind: "image", isPinned: false, ...data } as Media;
}

export async function createMedia(
  actionId: string,
  teamId: string,
  uploadedByUid: string,
  url: string,
  kind: MediaKind,
): Promise<string> {
  const ref = mediaCollection.doc();
  const newMedia: Omit<Media, "id" | "createdAt"> = {
    actionId,
    teamId,
    kind,
    url,
    isPinned: false,
    uploadedBy: uploadedByUid,
  };
  await ref.set({
    ...newMedia,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getMedia(mediaId: string): Promise<Media | null> {
  const snapshot = await mediaCollection.doc(mediaId).get();
  if (!snapshot.exists) return null;
  return toMedia(snapshot);
}

export async function listMediaForAction(actionId: string): Promise<Media[]> {
  const snapshot = await mediaCollection.where("actionId", "==", actionId).get();
  return snapshot.docs.map(toMedia);
}

export async function setMediaPinned(mediaId: string, isPinned: boolean): Promise<void> {
  await mediaCollection.doc(mediaId).update({ isPinned });
}

export async function deleteMedia(mediaId: string): Promise<void> {
  await mediaCollection.doc(mediaId).delete();
}
