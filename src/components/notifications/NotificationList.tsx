"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import {
  loadMoreNotificationsAction,
  markNotificationReadAction,
  type ClientNotification,
} from "@/app/[locale]/(app)/notifications/actions";
import { NotificationRow } from "@/components/notifications/NotificationRow";
import { Link } from "@/i18n/navigation";
import type { NotificationPageCursor } from "@/lib/notifications/notification-repository";

interface NotificationListProps {
  initialNotifications: ClientNotification[];
  initialCursor: NotificationPageCursor | null;
}

export function NotificationList({ initialNotifications, initialCursor }: NotificationListProps) {
  const t = useTranslations("notifications");
  const [notifications, setNotifications] = useState(initialNotifications);
  const [cursor, setCursor] = useState(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cursor) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setIsLoading(true);
        loadMoreNotificationsAction(cursor)
          .then((page) => {
            setNotifications((prev) => [...prev, ...page.notifications]);
            setCursor(page.nextCursor);
          })
          .finally(() => setIsLoading(false));
      }
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor]);

  function handleOpen(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    markNotificationReadAction(id).catch(() => {});
  }

  if (notifications.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <div className="space-y-1">
      {notifications.map((notification) => (
        <Link
          key={notification.id}
          href={`/teams/${notification.teamId}/actions/${notification.actionId}`}
          onClick={() => handleOpen(notification.id)}
          className="block rounded-lg p-3 transition-colors hover:bg-muted"
        >
          <NotificationRow notification={notification} />
        </Link>
      ))}
      {cursor ? (
        <div ref={sentinelRef} className="py-2 text-center text-sm text-muted-foreground">
          {isLoading ? t("loadingMore") : null}
        </div>
      ) : null}
    </div>
  );
}
