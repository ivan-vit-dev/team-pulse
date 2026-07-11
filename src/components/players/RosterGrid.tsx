import { YouthPrivacyBadge } from "@/components/players/YouthPrivacyBadge";
import { ReportButton } from "@/components/reports/ReportButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PlayerPublic } from "@/lib/types/player";

export function RosterGrid({
  players,
  currentUid,
}: {
  players: PlayerPublic[];
  currentUid: string | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {players.map((player) => (
        <div key={player.id} className="relative flex flex-col items-center gap-2 text-center">
          <ReportButton
            contentType="player"
            contentId={player.id}
            isSignedIn={currentUid !== null}
            className="absolute top-0 right-0"
          />
          <Avatar className="h-16 w-16">
            {player.avatarURL && <AvatarImage src={player.avatarURL} alt="" />}
            <AvatarFallback>{player.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1">
            <span className="font-display font-bold">{player.displayName}</span>
            {player.isYouth && <YouthPrivacyBadge />}
          </div>
          {player.jerseyNumber != null && (
            <span className="text-xs text-muted-foreground">#{player.jerseyNumber}</span>
          )}
        </div>
      ))}
    </div>
  );
}
