"use client";

import { Pin, PinOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import {
  deleteCommentAction,
  pinCommentAction,
  unpinCommentAction,
  type ClientComment,
} from "@/app/[locale]/teams/[teamId]/actions";
import { CommentForm } from "@/components/comments/CommentForm";
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

  function handlePosted(comment: ClientComment) {
    setComments((prev) => [...prev, comment]);
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

  return (
    <div className="space-y-4">
      {currentUid ? (
        <CommentForm actionId={actionId} teamId={teamId} onPosted={handlePosted} />
      ) : (
        <p className="text-sm text-muted-foreground">{t("loginToComment")}</p>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noCommentsYet")}</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const canDelete = currentUid === comment.authorUid || isTeamAdmin;
            return (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  {comment.authorPhotoURL && <AvatarImage src={comment.authorPhotoURL} alt="" />}
                  <AvatarFallback>
                    {comment.authorDisplayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold">{comment.authorDisplayName}</span>
                    {comment.isPinned && (
                      <Pin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-sm">{comment.text}</p>
                </div>
                <div className="flex items-center gap-1">
                  {isTeamAdmin && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={comment.isPinned ? t("unpin") : t("pin")}
                      disabled={pendingId === comment.id}
                      onClick={() => handleTogglePin(comment)}
                    >
                      {comment.isPinned ? (
                        <PinOff className="h-4 w-4" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={pendingId === comment.id}
                          >
                            {t("delete")}
                          </Button>
                        }
                      />
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("confirmDeleteTitle")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("confirmDeleteDescription")}
                          </AlertDialogDescription>
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
          })}
        </div>
      )}
    </div>
  );
}
