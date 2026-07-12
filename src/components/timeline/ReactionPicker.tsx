"use client";

import { SmilePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { setReactionAction } from "@/app/[locale]/teams/[teamId]/actions";
import { REACTION_EMOJI, REACTION_TYPES } from "@/lib/actions/reaction-utils";
import type { ReactionType } from "@/lib/types/action";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReactionPickerProps {
  actionId: string;
  initialCounts: Partial<Record<ReactionType, number>>;
  initialMyReaction: ReactionType | null;
}

export function ReactionPicker({
  actionId,
  initialCounts,
  initialMyReaction,
}: ReactionPickerProps) {
  const t = useTranslations("actions");
  const ta = useTranslations("auth");
  const [counts, setCounts] = useState(initialCounts);
  const [myReaction, setMyReaction] = useState(initialMyReaction);
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const totalCount = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);

  async function handlePick(type: ReactionType) {
    setOpen(false);
    const next = myReaction === type ? null : type;
    const prevCounts = counts;
    const prevMyReaction = myReaction;

    const adjusted = { ...counts };
    if (prevMyReaction) {
      adjusted[prevMyReaction] = Math.max(0, (adjusted[prevMyReaction] ?? 0) - 1);
    }
    if (next) {
      adjusted[next] = (adjusted[next] ?? 0) + 1;
    }

    setCounts(adjusted);
    setMyReaction(next);
    setIsPending(true);
    try {
      await setReactionAction(actionId, next);
    } catch {
      setCounts(prevCounts);
      setMyReaction(prevMyReaction);
      toast.error(ta("genericError"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" disabled={isPending} aria-label={t("react")}>
            {myReaction ? (
              <span aria-hidden="true">{REACTION_EMOJI[myReaction]}</span>
            ) : (
              <SmilePlus className="h-4 w-4" aria-hidden="true" />
            )}
            {totalCount}
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="flex w-auto gap-1 p-1">
        {REACTION_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            aria-label={t(`reaction.${type}`)}
            aria-pressed={myReaction === type}
            onClick={() => handlePick(type)}
            className="rounded-md p-1.5 text-lg transition-colors hover:bg-muted aria-pressed:bg-accent"
          >
            <span aria-hidden="true">{REACTION_EMOJI[type]}</span>
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
