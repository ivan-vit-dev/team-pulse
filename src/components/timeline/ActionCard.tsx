import { ActionTypeBadge } from "@/components/actions/ActionTypeBadge";
import { SquadChips, type ClientSafePlayer } from "@/components/timeline/SquadChips";
import { cn } from "@/lib/utils";
import type { Action } from "@/lib/types/action";

type ClientSafeAction = Omit<Action, "createdAt" | "updatedAt">;

interface ActionCardProps {
  action: ClientSafeAction;
  players: ClientSafePlayer[];
  variant: "next" | "past" | "upcoming";
}

export function ActionCard({ action, players, variant }: ActionCardProps) {
  return (
    <div
      className={cn(
        "animate-timeline-in space-y-2 rounded-lg border border-border p-4",
        variant === "next" && "animate-pulse-next",
      )}
      style={{
        boxShadow: variant === "next" ? "var(--timeline-next-ring)" : undefined,
        opacity: variant === "past" ? "var(--timeline-past-opacity)" : undefined,
        filter: variant === "upcoming" ? "var(--timeline-upcoming-filter)" : undefined,
      }}
    >
      <div className="flex items-center gap-2">
        <ActionTypeBadge type={action.type} />
        <span className="font-display font-bold">{action.title}</span>
        {action.result && (
          <span className="font-display font-bold">
            {action.result.ourScore} : {action.result.theirScore}
          </span>
        )}
      </div>
      <p className="font-display text-sm text-muted-foreground">
        {action.date}
        {action.time ? ` · ${action.time}` : ""}
        {action.location ? ` · ${action.location}` : ""}
      </p>
      <SquadChips playerIds={action.squadPlayerIds} players={players} />
    </div>
  );
}
