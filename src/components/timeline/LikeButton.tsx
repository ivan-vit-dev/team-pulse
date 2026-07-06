"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { likeActionAction, unlikeActionAction } from "@/app/[locale]/teams/[teamId]/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  actionId: string;
  initialIsLiked: boolean;
  initialCount: number;
}

export function LikeButton({ actionId, initialIsLiked, initialCount }: LikeButtonProps) {
  const ta = useTranslations("auth");
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    const next = !isLiked;
    setIsLiked(next);
    setCount((c) => (next ? c + 1 : c - 1));
    try {
      await (next ? likeActionAction(actionId) : unlikeActionAction(actionId));
    } catch {
      setIsLiked(!next);
      setCount((c) => (next ? c - 1 : c + 1));
      toast.error(ta("genericError"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={handleClick}
      aria-pressed={isLiked}
    >
      <Heart className={cn("h-4 w-4", isLiked && "fill-current text-destructive")} />
      {count}
    </Button>
  );
}
