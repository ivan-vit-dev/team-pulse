"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  getRecentNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/[locale]/(app)/notifications/actions";
import { NotificationRow } from "@/components/notifications/NotificationRow";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import { notificationHref } from "@/lib/notifications/notification-href";
import type { ClientNotification } from "@/lib/notifications/notification-repository";

interface NotificationBellProps {
  initialUnreadCount: number;
}

export function NotificationBell({ initialUnreadCount }: NotificationBellProps) {
  const t = useTranslations("notifications");
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Refreshed each time the dropdown opens rather than kept live — this app
  // deliberately has no real-time Firestore listeners (see CLAUDE.md); FCM
  // push is the "something changed right now" channel, this is the "let me
  // check" one.
  function handleOpenChange(open: boolean) {
    if (!open) return;
    getRecentNotificationsAction().then((result) => {
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setHasLoaded(true);
    });
  }

  function handleOpenNotification(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    markNotificationReadAction(id).catch(() => {});
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    markAllNotificationsReadAction().catch(() => {});
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="relative rounded-full p-2 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t("title")}
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-0.5 -right-0.5 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-1.5 py-1">
          <span className="text-sm font-medium">{t("title")}</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              {t("markAllRead")}
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {hasLoaded && notifications.length === 0 && (
          <p className="px-1.5 py-3 text-center text-sm text-muted-foreground">{t("empty")}</p>
        )}
        {notifications.map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            render={
              <Link
                href={notificationHref(notification)}
                onClick={() => handleOpenNotification(notification.id)}
              />
            }
          >
            <NotificationRow notification={notification} className="w-full" />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/notifications">{t("viewAll")}</Link>} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
