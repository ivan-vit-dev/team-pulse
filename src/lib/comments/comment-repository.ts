import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminFirestore } from "@/lib/firebase/admin";
import type { Comment } from "@/lib/types/comment";

const commentsCollection = adminFirestore.collection("comments");

export async function createComment(
  actionId: string,
  teamId: string,
  authorUid: string,
  authorDisplayName: string,
  authorPhotoURL: string | null,
  text: string,
  parentCommentId: string | null,
): Promise<string> {
  const ref = commentsCollection.doc();
  const newComment: Omit<Comment, "id" | "createdAt" | "updatedAt"> = {
    actionId,
    teamId,
    parentCommentId,
    authorUid,
    authorDisplayName,
    authorPhotoURL,
    text,
    isPinned: false,
  };
  await ref.set({
    ...newComment,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getComment(commentId: string): Promise<Comment | null> {
  const snapshot = await commentsCollection.doc(commentId).get();
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() } as Comment;
}

export async function listCommentsForAction(actionId: string): Promise<Comment[]> {
  const snapshot = await commentsCollection.where("actionId", "==", actionId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Comment);
}

export async function deleteComment(commentId: string): Promise<void> {
  await commentsCollection.doc(commentId).delete();
}

export async function setCommentPinned(commentId: string, isPinned: boolean): Promise<void> {
  await commentsCollection.doc(commentId).set(
    { isPinned, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}
