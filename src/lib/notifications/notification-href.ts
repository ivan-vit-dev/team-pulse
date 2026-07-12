import type { ClientNotification } from "@/lib/notifications/notification-repository";
import type { AppNotification } from "@/lib/types/notification";

export function notificationHref(notification: AppNotification | ClientNotification): string {
  switch (notification.type) {
    case "newAction":
    case "actionUpdated":
      return `/teams/${notification.teamId}/actions/${notification.actionId}`;
    case "adminInvite":
    case "followInvite":
      return "/invites";
    case "commentReply":
      return `/teams/${notification.teamId}/actions/${notification.actionId}`;
  }
}
