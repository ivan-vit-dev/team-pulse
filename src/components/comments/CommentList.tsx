"use client";

import { CornerDownRight, Pin, PinOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import {
  deleteCommentAction,
  pinCommentAction,
  unpinCommentAction,
  type ClientComment,
} from "@/app/[locale]/teams/[teamId]/actions";
import { CommentForm, type ReplyingTo } from "@/components/comments/CommentForm";
import { ReportButton } from "@/components/reports/ReportButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CommentListProps {
  actionId: string;
  teamId: string;
  initialComments: ClientComment[];
  currentUid: string | null;
  isTeamAdmin: boolean;
}

export function CommentList({
  actionId,
  teamId,
  initialComments,
  currentUid,
  isTeamAdmin,
}: CommentListProps) {
  const t = useTranslations("comments");
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const [comments, setComments] = useState(initialComments);
  const [pendingId, setPendingId] = useState<string | null>(null);
  // The thread (top-level comment id) whose inline reply box is open, and
  // who it's contextually replying to — which may be a nested reply's
  // author even though `parentCommentId` sent to the server always points
  // at the thread's top-level comment (single-level threading, see plan).
  const [activeReplyThreadId, setActiveReplyThreadId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);

  function handlePosted(comment: ClientComment) {
    setComments((prev) => [...prev, comment]);
  }

  function handleReplyClick(threadId: string, target: ReplyingTo) {
    setActiveReplyThreadId(threadId);
    setReplyingTo(target);
  }

  function handleCancelReply() {
    setActiveReplyThreadId(null);
    setReplyingTo(null);
  }

  async function handleDelete(commentId: string) {
    setPendingId(commentId);
    try {
      await deleteCommentAction(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setPendingId(null);
    }
  }

  async function handleTogglePin(comment: ClientComment) {
    setPendingId(comment.id);
    try {
      if (comment.isPinned) {
        await unpinCommentAction(comment.id);
      } else {
        await pinCommentAction(comment.id);
      }
      setComments((prev) =>
        prev
          .map((c) => (c.id === comment.id ? { ...c, isPinned: !c.isPinned } : c))
          .sort((a, b) => Number(b.isPinned) - Number(a.isPinned)),
      );
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setPendingId(null);
    }
  }

  const topLevelComments = comments
    .filter((c) => !c.parentCommentId)
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned));
  const repliesByParent = new Map<string, ClientComment[]>();
  for (const comment of comments) {
    if (!comment.parentCommentId) continue;
    const existing = repliesByParent.get(comment.parentCommentId) ?? [];
    existing.push(comment);
    repliesByParent.set(comment.parentCommentId, existing);
  }

  function renderComment(comment: ClientComment, { isReply }: { isReply: boolean }) {
    const canDelete = currentUid === comment.authorUid || isTeamAdmin;
    const threadId = isReply ? (comment.parentCommentId ?? comment.id) : comment.id;
    return (
      <div key={comment.id} className={cn("flex items-start gap-3", isReply && "ml-10")}>
        <Avatar className="h-8 w-8">
          {comment.authorPhotoURL && <AvatarImage src={comment.authorPhotoURL} alt="" />}
          <AvatarFallback>{comment.authorDisplayName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold">{comment.authorDisplayName}</span>
            {comment.isPinned && (
              <Pin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
          <p className="text-sm">{comment.text}</p>
          {currentUid && (
            <button
              type="button"
              onClick={() =>
                handleReplyClick(threadId, {
                  commentId: threadId,
                  authorDisplayName: comment.authorDisplayName,
                })
              }
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              <CornerDownRight className="h-3 w-3" aria-hidden="true" />
              {t("reply")}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <ReportButton
            contentType="comment"
            contentId={comment.id}
            isSignedIn={currentUid !== null}
          />
          {isTeamAdmin && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={comment.isPinned ? t("unpin") : t("pin")}
              disabled={pendingId === comment.id}
              onClick={() => handleTogglePin(comment)}
            >
              {comment.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="ghost" size="sm" disabled={pendingId === comment.id}>
                    {t("delete")}
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("confirmDeleteTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("confirmDeleteDescription")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={pendingId === comment.id}
                    onClick={() => handleDelete(comment.id)}
                  >
                    {t("delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {currentUid ? (
        <CommentForm actionId={actionId} teamId={teamId} onPosted={handlePosted} />
      ) : (
        <p className="text-sm text-muted-foreground">{t("loginToComment")}</p>
      )}

      {topLevelComments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noCommentsYet")}</p>
      ) : (
        <div className="space-y-4">
          {topLevelComments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              {renderComment(comment, { isReply: false })}
              {(repliesByParent.get(comment.id) ?? []).map((reply) =>
                renderComment(reply, { isReply: true }),
              )}
              {activeReplyThreadId === comment.id && replyingTo && (
                <div className="ml-10">
                  <CommentForm
                    actionId={actionId}
                    teamId={teamId}
                    onPosted={handlePosted}
                    replyingTo={replyingTo}
                    onCancelReply={handleCancelReply}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
