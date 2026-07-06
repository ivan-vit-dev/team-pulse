import { ActionCard } from "@/components/timeline/ActionCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation";
import type { Action } from "@/lib/types/action";
import type { Team } from "@/lib/types/team";

type ClientSafeAction = Omit<Action, "createdAt" | "updatedAt">;

export interface FeedEntry {
  team: Team;
  nextAction: ClientSafeAction | null;
}

interface FollowedTeamsFeedProps {
  entries: FeedEntry[];
  noUpcomingActionsLabel: string;
  commentsLabel: string;
  currentUid: string;
}

export function FollowedTeamsFeed({
  entries,
  noUpcomingActionsLabel,
  commentsLabel,
  currentUid,
}: FollowedTeamsFeedProps) {
  return (
    <div className="w-full max-w-lg space-y-4 text-left">
      {entries.map(({ team, nextAction }) => (
        <div key={team.id} className="space-y-2">
          <Link href={`/teams/${team.id}`} className="flex items-center gap-2">
            <Avatar className="h-8 w-8 rounded-lg">
              {team.logoURL && <AvatarImage src={team.logoURL} alt="" />}
              <AvatarFallback className="rounded-lg">
                {team.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-display font-bold">{team.name}</span>
          </Link>
          {nextAction ? (
            <ActionCard
              action={nextAction}
              players={[]}
              variant="next"
              teamId={team.id}
              currentUid={currentUid}
              commentsLabel={commentsLabel}
            />
          ) : (
            <p className="pl-10 text-sm text-muted-foreground">{noUpcomingActionsLabel}</p>
          )}
        </div>
      ))}
    </div>
  );
}
