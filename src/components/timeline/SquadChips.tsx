import { YouthPrivacyBadge } from "@/components/players/YouthPrivacyBadge";
import type { PlayerPublic } from "@/lib/types/player";

export type ClientSafePlayer = Omit<PlayerPublic, "createdAt" | "updatedAt">;

interface SquadChipsProps {
  playerIds: string[];
  players: ClientSafePlayer[];
}

export function SquadChips({ playerIds, players }: SquadChipsProps) {
  const squad = playerIds
    .map((id) => players.find((player) => player.id === id))
    .filter((player): player is ClientSafePlayer => player !== undefined);

  if (squad.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {squad.map((player) => (
        <span
          key={player.id}
          className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
        >
          {player.displayName}
          {player.isYouth && <YouthPrivacyBadge />}
        </span>
      ))}
    </div>
  );
}
