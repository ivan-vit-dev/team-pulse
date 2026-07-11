"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { ActionType } from "@/lib/types/action";

const ACTION_TYPE_VAR: Record<ActionType, string> = {
  match: "--action-match",
  training: "--action-training",
  tournament: "--action-tournament",
  cup: "--action-cup",
  other: "--action-other",
};

const ACTION_TYPE_FOREGROUND_VAR: Record<ActionType, string> = {
  match: "--action-match-foreground",
  training: "--action-training-foreground",
  tournament: "--action-tournament-foreground",
  cup: "--action-cup-foreground",
  other: "--action-other-foreground",
};

export function ActionTypeBadge({
  type,
  className,
}: {
  type: ActionType;
  className?: string;
}) {
  const t = useTranslations("actions");
  const cssVar = ACTION_TYPE_VAR[type];
  const foregroundVar = ACTION_TYPE_FOREGROUND_VAR[type];

  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-full px-2 text-xs font-medium whitespace-nowrap",
        className,
      )}
      style={{
        backgroundColor: `color-mix(in oklch, var(${cssVar}) 18%, transparent)`,
        color: `var(${foregroundVar})`,
      }}
    >
      {t(`type.${type}`)}
    </span>
  );
}
