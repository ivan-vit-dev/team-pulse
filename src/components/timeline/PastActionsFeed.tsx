"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { loadMorePastActionsAction } from "@/app/[locale]/teams/[teamId]/actions";
import { ActionCard } from "@/components/timeline/ActionCard";
import type { ClientSafePlayer } from "@/components/timeline/SquadChips";
import type { ActionPageCursor } from "@/lib/actions/action-repository";
import type { Action } from "@/lib/types/action";

type ClientSafeAction = Omit<Action, "createdAt" | "updatedAt">;

interface PastActionsFeedProps {
  teamId: string;
  seasonId: string;
  players: ClientSafePlayer[];
  initialActions: ClientSafeAction[];
  initialCursor: ActionPageCursor | null;
  currentUid: string | null;
}

export function PastActionsFeed({
  teamId,
  seasonId,
  players,
  initialActions,
  initialCursor,
  currentUid,
}: PastActionsFeedProps) {
  const t = useTranslations("timeline");
  const ta = useTranslations("actions");
  const [actions, setActions] = useState(initialActions);
  const [cursor, setCursor] = useState(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cursor) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setIsLoading(true);
        loadMorePastActionsAction(seasonId, cursor)
          .then((page) => {
            setActions((prev) => [...prev, ...page.actions]);
            setCursor(page.nextCursor);
          })
          .finally(() => setIsLoading(false));
      }
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, seasonId]);

  if (actions.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noActionsYet")}</p>;
  }

  return (
    <div className="space-y-3">
      {actions.map((action) => (
        <ActionCard
          key={action.id}
          action={action}
          players={players}
          variant="past"
          teamId={teamId}
          currentUid={currentUid}
          commentsLabel={ta("viewComments")}
        />
      ))}
      {cursor ? (
        <div ref={sentinelRef} className="py-2 text-center text-sm text-muted-foreground">
          {isLoading ? t("loadingMore") : null}
        </div>
      ) : (
        <p className="py-2 text-center text-sm text-muted-foreground">{t("noMoreActions")}</p>
      )}
    </div>
  );
}
