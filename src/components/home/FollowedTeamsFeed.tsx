import { ActionTypeBadge } from "@/components/actions/ActionTypeBadge";
import { ReactionPicker } from "@/components/timeline/ReactionPicker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation";
import { getReactionCounts } from "@/lib/actions/reaction-utils";
import type { Action } from "@/lib/types/action";
import type { Team } from "@/lib/types/team";
import { getTeamAccentColor, getTeamAvatarTextColor } from "@/lib/utils/teamAccent";

type ClientSafeAction = Omit<Action, "createdAt" | "updatedAt">;

export interface FeedEntry {
  team: Team;
  nextAction: ClientSafeAction | null;
}

interface FollowedTeamsFeedProps {
  entries: FeedEntry[];
  noUpcomingActionsLabel: string;
  commentsLabel: string;
  nextLabel: string;
  currentUid: string;
}

export function FollowedTeamsFeed({
  entries,
  noUpcomingActionsLabel,
  commentsLabel,
  nextLabel,
  currentUid,
}: FollowedTeamsFeedProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {entries.map(({ team, nextAction }, index) => {
        const accent = getTeamAccentColor(team, index);
        const avatarTextColor = getTeamAvatarTextColor(team);

        return (
          <div
            key={team.id}
            className="animate-timeline-in group relative flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            style={{ animationDelay: `${index * 40}ms`, animationFillMode: "backwards" }}
          >
            {/* Stretched link: makes the whole tile clickable while the Like
                button and Comments link below stay independently clickable
                via their own pointer-events-auto (see CSS-Tricks "block link"
                pattern) — avoids nesting an <a> inside another <a>/<button>. */}
            <Link
              href={`/teams/${team.id}`}
              aria-label={team.name}
              className="absolute inset-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            />

            <div className="pointer-events-none flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0 rounded-lg">
                {team.logoURL && <AvatarImage src={team.logoURL} alt="" />}
                <AvatarFallback className="rounded-lg" style={{ background: accent, color: avatarTextColor }}>
                  {team.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-display truncate font-bold">{team.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {team.category}
                  {team.club ? ` · ${team.club}` : ""}
                </p>
              </div>
            </div>

            <div className="pointer-events-none flex flex-1 flex-col justify-center rounded-lg bg-muted/40 p-3">
              {nextAction ? (
                <div className="space-y-1.5">
                  <span className="font-display text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    {nextLabel}
                  </span>
                  <div className="flex items-center gap-2">
                    <ActionTypeBadge type={nextAction.type} />
                    <span className="font-display truncate text-sm font-bold">{nextAction.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {nextAction.date}
                    {nextAction.time ? ` · ${nextAction.time}` : ""}
                    {nextAction.location ? ` · ${nextAction.location}` : ""}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="pointer-events-auto">
                      <ReactionPicker
                        actionId={nextAction.id}
                        initialCounts={getReactionCounts(nextAction.reactions ?? {})}
                        initialMyReaction={(nextAction.reactions ?? {})[currentUid] ?? null}
                      />
                    </span>
                    <Link
                      href={`/teams/${team.id}/actions/${nextAction.id}`}
                      className="pointer-events-auto text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {commentsLabel}
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{noUpcomingActionsLabel}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
