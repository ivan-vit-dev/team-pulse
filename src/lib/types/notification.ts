import type { Timestamp } from "firebase-admin/firestore";

import type { ActionType } from "@/lib/types/action";

export type NotificationType =
  | "newAction"
  | "actionUpdated"
  | "adminInvite"
  | "commentReply"
  | "followInvite";

interface BaseNotification {
  id: string;
  isRead: boolean;
  createdAt: Timestamp;
}

export interface ActionNotification extends BaseNotification {
  type: "newAction" | "actionUpdated";
  teamId: string;
  teamName: string;
  actionId: string;
  actionType: ActionType;
  actionTitle: string;
}

export interface AdminInviteNotification extends BaseNotification {
  type: "adminInvite";
  teamId: string;
  teamName: string;
  inviteId: string;
}

export interface CommentReplyNotification extends BaseNotification {
  type: "commentReply";
  teamId: string;
  actionId: string;
  commentId: string;
  replierDisplayName: string;
  commentTextPreview: string;
}

export interface FollowInviteNotification extends BaseNotification {
  type: "followInvite";
  teamId: string;
  teamName: string;
  inviteId: string;
}

export type AppNotification =
  | ActionNotification
  | AdminInviteNotification
  | CommentReplyNotification
  | FollowInviteNotification;
