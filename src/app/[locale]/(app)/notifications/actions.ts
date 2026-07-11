"use server";

import { requireUid } from "@/lib/auth/require-uid";
import {
  getUnreadNotificationCount,
  listNotificationsPage,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_PAGE_SIZE,
  type NotificationPageCursor,
} from "@/lib/notifications/notification-repository";
import type { AppNotification } from "@/lib/types/notification";
import { omit } from "@/lib/utils/omit";

// createdAt kept as an ISO string (same convention as ReportSummary.createdAt
// in ReportsAdminList) rather than dropped outright — a Timestamp instance
// can't cross the Server Action boundary, but the inbox still needs to show
// when each notification arrived.
export type ClientNotification = Omit<AppNotification, "createdAt"> & { createdAt: string };

export interface ClientNotificationPage {
  notifications: ClientNotification[];
  nextCursor: NotificationPageCursor | null;
}

function toClientNotification(notification: AppNotification): ClientNotification {
  return {
    ...omit(notification, "createdAt"),
    createdAt: notification.createdAt.toDate().toISOString(),
  };
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
