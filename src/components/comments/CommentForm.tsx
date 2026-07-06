"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { createCommentAction, type ClientComment } from "@/app/[locale]/teams/[teamId]/actions";
import { Button } from "@/components/ui/button";

interface CommentFormProps {
  actionId: string;
  teamId: string;
  onPosted: (comment: ClientComment) => void;
}

export function CommentForm({ actionId, teamId, onPosted }: CommentFormProps) {
  const t = useTranslations("comments");
  const ta = useTranslations("auth");
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
      const comment = await createCommentAction(actionId, teamId, text);
      onPosted(comment);
      setText("");
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("placeholder")}
        maxLength={500}
        rows={3}
        className="w-full rounded-lg border border-border bg-background p-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <Button type="submit" size="sm" disabled={isSubmitting || !text.trim()}>
        {t("post")}
      </Button>
    </form>
  );
}
