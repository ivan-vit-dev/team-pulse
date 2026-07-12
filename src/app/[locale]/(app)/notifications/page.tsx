import { getTranslations } from "next-intl/server";

import { NotificationList } from "@/components/notifications/NotificationList";
import { getCurrentUser } from "@/lib/auth/session";
import {
  listNotificationsPage,
  NOTIFICATIONS_PAGE_SIZE,
  toClientNotification,
} from "@/lib/notifications/notification-repository";

export default async function NotificationsPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations("notifications")]);

  if (!user) {
    // The (app) layout already redirects unauthenticated requests; this is
    // just a type-narrowing guard for the render below.
    return null;
  }

  const page = await listNotificationsPage(user.uid, { pageSize: NOTIFICATIONS_PAGE_SIZE });
  const initialNotifications = page.notifications.map(toClientNotification);

  return (
    <div className="space-y-6">
      <h1 className="font-impact text-4xl uppercase">{t("title")}</h1>
      <NotificationList initialNotifications={initialNotifications} initialCursor={page.nextCursor} />
    </div>
  );
}
