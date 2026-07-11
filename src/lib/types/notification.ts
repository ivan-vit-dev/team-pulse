import type { Timestamp } from "firebase-admin/firestore";

import type { ActionType } from "@/lib/types/action";

export type NotificationType = "newAction";

export interface AppNotification {
  id: string;
  type: NotificationType;
  teamId: string;
  teamName: string;
  actionId: string;
  actionType: ActionType;
  actionTitle: string;
  isRead: boolean;
  createdAt: Timestamp;
}
