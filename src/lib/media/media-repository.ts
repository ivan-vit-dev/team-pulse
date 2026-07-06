import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminFirestore } from "@/lib/firebase/admin";
import type { Media } from "@/lib/types/media";

const mediaCollection = adminFirestore.collection("media");

export async function createMedia(
  actionId: string,
  teamId: string,
  uploadedByUid: string,
  url: string,
): Promise<string> {
  const ref = mediaCollection.doc();
  const newMedia: Omit<Media, "id" | "createdAt"> = {
    actionId,
    teamId,
    url,
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
  return { id: snapshot.id, ...snapshot.data() } as Media;
}

export async function listMediaForAction(actionId: string): Promise<Media[]> {
  const snapshot = await mediaCollection.where("actionId", "==", actionId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Media);
}

export async function deleteMedia(mediaId: string): Promise<void> {
  await mediaCollection.doc(mediaId).delete();
}
