"use server";

import { requireUid } from "@/lib/auth/require-uid";
import {
  getUnreadNotificationCount,
  listNotificationsPage,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_PAGE_SIZE,
  toClientNotification,
  type ClientNotification,
  type NotificationPageCursor,
} from "@/lib/notifications/notification-repository";

// NOT re-exported from here: a "use server" file's transform mishandles
// `export type { X }` re-exports — it generates a runtime binding for `X`
// with nothing to initialize it, throwing `ReferenceError: X is not defined`
// at module evaluation. Since this Navbar-adjacent module (via
// NotificationBell) gets pulled into every page's Server Action bundle,
// that error broke every Server Action on every page, not just this one.
// Consumers must import ClientNotification directly from
// notification-repository.ts instead.

export interface ClientNotificationPage {
  notifications: ClientNotification[];
  nextCursor: NotificationPageCursor | null;
}

// Small first page for the Navbar dropdown, refreshed on demand (opened),
// not subscribed to — see CLAUDE.md for why this app avoids real-time
// listeners for anything besides FCM push.
const RECENT_NOTIFICATIONS_PAGE_SIZE = 5;

export async function getRecentNotificationsAction(): Promise<{
  notifications: ClientNotification[];
  unreadCount: number;
}> {
  const uid = await requireUid();
  const [page, unreadCount] = await Promise.all([
    listNotificationsPage(uid, { pageSize: RECENT_NOTIFICATIONS_PAGE_SIZE }),
    getUnreadNotificationCount(uid),
  ]);
  return {
    notifications: page.notifications.map(toClientNotification),
    unreadCount,
  };
}

export async function loadMoreNotificationsAction(
  cursor: NotificationPageCursor,
): Promise<ClientNotificationPage> {
  const uid = await requireUid();
  const page = await listNotificationsPage(uid, { pageSize: NOTIFICATIONS_PAGE_SIZE, cursor });
  return {
    notifications: page.notifications.map(toClientNotification),
    nextCursor: page.nextCursor,
  };
}

export async function markNotificationReadAction(notificationId: string): Promise<void> {
  const uid = await requireUid();
  await markNotificationRead(uid, notificationId);
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const uid = await requireUid();
  await markAllNotificationsRead(uid);
}
