import { getTranslations } from "next-intl/server";

import { ActionCard } from "@/components/timeline/ActionCard";
import type { ClientSafePlayer } from "@/components/timeline/SquadChips";
import type { Action } from "@/lib/types/action";

type ClientSafeAction = Omit<Action, "createdAt" | "updatedAt">;

interface UpcomingActionsListProps {
  teamId: string;
  actions: ClientSafeAction[];
  players: ClientSafePlayer[];
  currentUid: string | null;
}

export async function UpcomingActionsList({
  teamId,
  actions,
  players,
  currentUid,
}: UpcomingActionsListProps) {
  if (actions.length === 0) return null;

  const ta = await getTranslations("actions");

  return (
    <div className="space-y-3">
      {actions.map((action) => (
        <ActionCard
          key={action.id}
          action={action}
          players={players}
          variant="upcoming"
          teamId={teamId}
          currentUid={currentUid}
          commentsLabel={ta("viewComments")}
        />
      ))}
    </div>
  );
}
