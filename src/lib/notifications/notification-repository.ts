import "server-only";

import { FieldPath, Timestamp } from "firebase-admin/firestore";

import { adminFirestore } from "@/lib/firebase/admin";
import type { AppNotification } from "@/lib/types/notification";

function notificationsCollection(uid: string) {
  return adminFirestore.collection("users").doc(uid).collection("notifications");
}

export const NOTIFICATIONS_PAGE_SIZE = 10;

export interface NotificationPageCursor {
  createdAtSeconds: number;
  createdAtNanoseconds: number;
  id: string;
}

export interface NotificationPage {
  notifications: AppNotification[];
  nextCursor: NotificationPageCursor | null;
}

// createdAt kept as an ISO string (same convention as ReportSummary.createdAt
// in ReportsAdminList) rather than dropped outright — a Timestamp instance
// can't cross the Server Action/Server Component boundary, but the inbox
// still needs to show when each notification arrived.
//
// A plain `Omit<AppNotification, "createdAt">` does NOT distribute over the
// union (keyof a union only sees fields common to every member), which would
// silently collapse this to just {id, type, isRead} and drop
// actionId/inviteId/commentId etc. This conditional type is distributive
// because T is a naked type parameter, so it maps over each union member
// individually instead.
type WithStringCreatedAt<T> = T extends { createdAt: unknown }
  ? Omit<T, "createdAt"> & { createdAt: string }
  : T;

export type ClientNotification = WithStringCreatedAt<AppNotification>;

export function toClientNotification(notification: AppNotification): ClientNotification {
  const { createdAt, ...rest } = notification;
  return { ...rest, createdAt: createdAt.toDate().toISOString() } as ClientNotification;
}

// documentId() tiebreak for the same reason listPastActionsForSeasonPage uses
// one: multiple notifications can share a createdAt (a batch write from one
// onActionCreated fan-out all get the same server timestamp), and
// startAfter(createdAt) alone would non-deterministically skip/repeat one at
// a page boundary.
export async function listNotificationsPage(
  uid: string,
  { pageSize, cursor }: { pageSize: number; cursor?: NotificationPageCursor },
): Promise<NotificationPage> {
  let query = notificationsCollection(uid)
    .orderBy("createdAt", "desc")
    .orderBy(FieldPath.documentId(), "desc");
  if (cursor) {
    query = query.startAfter(
      new Timestamp(cursor.createdAtSeconds, cursor.createdAtNanoseconds),
      cursor.id,
    );
  }
  const snapshot = await query.limit(pageSize + 1).get();
  const hasMore = snapshot.docs.length > pageSize;
  const docs = snapshot.docs.slice(0, pageSize);
  const notifications = docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AppNotification);
  const last = docs[docs.length - 1];
  const lastCreatedAt = last && (last.data() as AppNotification).createdAt;
  return {
    notifications,
    nextCursor:
      hasMore && last && lastCreatedAt
        ? {
            createdAtSeconds: lastCreatedAt.seconds,
            createdAtNanoseconds: lastCreatedAt.nanoseconds,
            id: last.id,
          }
        : null,
  };
}

export async function getUnreadNotificationCount(uid: string): Promise<number> {
  const snapshot = await notificationsCollection(uid).where("isRead", "==", false).count().get();
  return snapshot.data().count;
}

export async function markNotificationRead(uid: string, notificationId: string): Promise<void> {
  await notificationsCollection(uid).doc(notificationId).set({ isRead: true }, { merge: true });
}

export async function markAllNotificationsRead(uid: string): Promise<void> {
  const unread = await notificationsCollection(uid).where("isRead", "==", false).get();
  if (unread.empty) return;
  const batch = adminFirestore.batch();
  unread.docs.forEach((doc) => batch.set(doc.ref, { isRead: true }, { merge: true }));
  await batch.commit();
}
