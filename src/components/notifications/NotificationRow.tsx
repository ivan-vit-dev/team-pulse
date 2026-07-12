import { useTranslations } from "next-intl";

import type { ClientNotification } from "@/lib/notifications/notification-repository";
import { cn } from "@/lib/utils";

interface NotificationRowProps {
  notification: ClientNotification;
  className?: string;
}

// Shared row body for both the Navbar dropdown (wrapped in a DropdownMenuItem)
// and the full /notifications inbox page (wrapped in a plain list item) —
// only the wrapper differs, not the content.
export function NotificationRow({ notification, className }: NotificationRowProps) {
  const t = useTranslations("notifications");
  const ta = useTranslations("actions");

  let title: string;
  let subtitle: string;

  switch (notification.type) {
    case "newAction":
      title = t("newAction", {
        type: ta(`type.${notification.actionType}`),
        team: notification.teamName,
      });
      subtitle = notification.actionTitle;
      break;
    case "actionUpdated":
      title = t("actionUpdated", {
        type: ta(`type.${notification.actionType}`),
        team: notification.teamName,
      });
      subtitle = notification.actionTitle;
      break;
    case "adminInvite":
      title = t("adminInvite", { team: notification.teamName });
      subtitle = notification.teamName;
      break;
    case "followInvite":
      title = t("followInvite", { team: notification.teamName });
      subtitle = notification.teamName;
      break;
    case "commentReply":
      title = t("commentReply", { name: notification.replierDisplayName });
      subtitle = notification.commentTextPreview;
      break;
  }

  return (
    <div className={cn("flex min-w-0 items-start gap-2", className)}>
      {!notification.isRead && (
        <span
          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
          aria-hidden="true"
        />
      )}
      <div className={cn("min-w-0 flex-1", notification.isRead && "pl-3.5")}>
        <p className="truncate text-sm">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
