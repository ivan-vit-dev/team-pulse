import { ActionCard } from "@/components/timeline/ActionCard";
import type { ClientSafePlayer } from "@/components/timeline/SquadChips";
import type { Action } from "@/lib/types/action";

type ClientSafeAction = Omit<Action, "createdAt" | "updatedAt">;

interface UpcomingActionsListProps {
  actions: ClientSafeAction[];
  players: ClientSafePlayer[];
}

export function UpcomingActionsList({ actions, players }: UpcomingActionsListProps) {
  if (actions.length === 0) return null;

  return (
    <div className="space-y-3">
      {actions.map((action) => (
        <ActionCard key={action.id} action={action} players={players} variant="upcoming" />
      ))}
    </div>
  );
}
