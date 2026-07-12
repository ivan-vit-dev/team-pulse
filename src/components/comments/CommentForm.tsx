"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { createCommentAction, type ClientComment } from "@/app/[locale]/teams/[teamId]/actions";
import { Button } from "@/components/ui/button";

export interface ReplyingTo {
  commentId: string;
  authorDisplayName: string;
}

interface CommentFormProps {
  actionId: string;
  teamId: string;
  onPosted: (comment: ClientComment) => void;
  replyingTo?: ReplyingTo | null;
  onCancelReply?: () => void;
}

export function CommentForm({
  actionId,
  teamId,
  onPosted,
  replyingTo = null,
  onCancelReply,
}: CommentFormProps) {
  const t = useTranslations("comments");
  const ta = useTranslations("auth");
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
      const comment = await createCommentAction(
        actionId,
        teamId,
        text,
        replyingTo?.commentId ?? null,
      );
      onPosted(comment);
      setText("");
      onCancelReply?.();
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {replyingTo && (
        <div className="flex items-center justify-between rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
          <span>{t("replyingTo", { name: replyingTo.authorDisplayName })}</span>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label={t("cancelReply")}
            className="rounded-full p-0.5 hover:bg-background"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("placeholder")}
        maxLength={500}
        rows={3}
        className="w-full rounded-lg border border-border bg-background p-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <Button type="submit" size="sm" disabled={isSubmitting || !text.trim()}>
        {replyingTo ? t("postReply") : t("post")}
      </Button>
    </form>
  );
}
