import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { RosterGrid } from "@/components/players/RosterGrid";
import { ReportButton } from "@/components/reports/ReportButton";
import { SeasonSwitcher } from "@/components/seasons/SeasonSwitcher";
import { FollowButton } from "@/components/teams/FollowButton";
import { TeamActionsGate } from "@/components/teams/TeamActionsGate";
import { ActionCard } from "@/components/timeline/ActionCard";
import { PastActionsFeed } from "@/components/timeline/PastActionsFeed";
import { UpcomingActionsList } from "@/components/timeline/UpcomingActionsList";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  listPastActionsForSeasonPage,
  listUpcomingActionsForSeason,
  PAST_ACTIONS_PAGE_SIZE,
} from "@/lib/actions/action-repository";
import { getCurrentUser } from "@/lib/auth/session";
import { listPlayersForTeam } from "@/lib/players/player-repository";
import { listSeasonsForTeam } from "@/lib/seasons/season-repository";
import { getTeam } from "@/lib/teams/team-repository";
import { omit } from "@/lib/utils/omit";

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const { teamId } = await params;
  const { season: seasonParam } = await searchParams;
  const team = await getTeam(teamId);
  if (!team) {
    notFound();
  }

  const [user, t, tl, ta] = await Promise.all([
    getCurrentUser(),
    getTranslations("teams"),
    getTranslations("timeline"),
    getTranslations("actions"),
  ]);

  const isAdmin = user !== null && team.adminUids.includes(user.uid);
  const isFollowing = user !== null && user.followedTeamIds.includes(teamId);
  // Actions and roster are world-readable in firestore.rules — this gate is
  // an engagement nudge (follow to unlock them), not a security boundary, so
  // admins of the team always see both regardless of follow status, and the
  // queries below are simply skipped otherwise.
  const canSeeActions = isFollowing || isAdmin;

  const teamScopeStyle = team.colors
    ? ({
        "--team-primary": team.colors.primary,
        "--team-secondary": team.colors.secondary,
      } as React.CSSProperties)
    : undefined;

  const players = canSeeActions ? await listPlayersForTeam(teamId) : [];
  const clientPlayers = players.map((player) => omit(player, "createdAt", "updatedAt"));

  const seasons = canSeeActions ? await listSeasonsForTeam(teamId) : [];
  const sortedSeasons = [...seasons].sort(
    (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis(),
  );
  const selectedSeason =
    sortedSeasons.find((season) => season.id === seasonParam) ??
    sortedSeasons.find((season) => season.isActive) ??
    sortedSeasons[0] ??
    null;
  const clientSeasons = sortedSeasons.map((season) => omit(season, "createdAt", "updatedAt"));

  const [upcomingActions, pastActionsPage] = selectedSeason
    ? await Promise.all([
        listUpcomingActionsForSeason(selectedSeason.id),
        listPastActionsForSeasonPage(selectedSeason.id, { pageSize: PAST_ACTIONS_PAGE_SIZE }),
      ])
    : [[], { actions: [], nextCursor: null }];
  const nextAction = upcomingActions[0] ?? null;
  const laterUpcomingActions = upcomingActions.slice(1);
  const hasAnyActions =
    nextAction !== null || laterUpcomingActions.length > 0 || pastActionsPage.actions.length > 0;

  return (
    <div className="team-scope space-y-6" style={teamScopeStyle}>
      <div className="bg-pitch-lines relative overflow-hidden rounded-2xl border border-border p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-[1]"
          style={{
            background:
              "radial-gradient(90% 140% at 100% 0%, color-mix(in oklch, var(--primary) 12%, transparent), transparent 60%)",
          }}
        />
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-lg" size="lg">
              {team.logoURL && <AvatarImage src={team.logoURL} alt="" />}
              <AvatarFallback className="rounded-lg">
                {team.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-impact text-3xl uppercase">{team.name}</h1>
              <p className="text-sm text-muted-foreground">
                {team.category}
                {team.club ? ` · ${team.club}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {team.location} · {team.homePitch}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && !isAdmin && (
              // Keyed on the server-computed value: after the gate's Follow
              // button triggers router.refresh(), this must re-initialize
              // from the fresh prop rather than keep its own stale state.
              <FollowButton key={String(isFollowing)} teamId={teamId} initialIsFollowing={isFollowing} />
            )}
            {user && !isAdmin && (
              <ReportButton contentType="team" contentId={teamId} isSignedIn={user !== null} />
            )}
            {isAdmin && (
              <Button variant="outline" render={<Link href={`/teams/${teamId}/admin`}>{t("adminDashboard")}</Link>} />
            )}
          </div>
        </div>
      </div>

      {!canSeeActions ? (
        <TeamActionsGate teamId={teamId} isLoggedIn={user !== null} />
      ) : (
        <div className="space-y-3">
          {selectedSeason && (
            <div className="flex items-center gap-3">
              <SeasonSwitcher
                teamId={teamId}
                seasons={clientSeasons}
                selectedSeasonId={selectedSeason.id}
                basePath={`/teams/${teamId}`}
              />
            </div>
          )}

          {!selectedSeason ? (
            <p className="text-sm text-muted-foreground">{tl("noSeasonsYet")}</p>
          ) : !hasAnyActions ? (
            <p className="text-sm text-muted-foreground">{tl("noActionsYet")}</p>
          ) : (
            <>
              {laterUpcomingActions.length > 0 && (
                <div className="space-y-2">
                  <h2 className="font-display text-lg font-bold">{tl("upcoming")}</h2>
                  <UpcomingActionsList
                    teamId={teamId}
                    actions={laterUpcomingActions.map((action) => omit(action, "createdAt", "updatedAt"))}
                    players={clientPlayers}
                    currentUid={user?.uid ?? null}
                  />
                </div>
              )}

              {nextAction && (
                // Pinned between Upcoming and Past: stays visible as the
                // rest of the feed scrolls past it, instead of scrolling
                // away like a regular section.
                <div className="sticky top-16 z-10 space-y-2 bg-background py-2">
                  <h2 className="font-display text-lg font-bold">{tl("next")}</h2>
                  <ActionCard
                    action={omit(nextAction, "createdAt", "updatedAt")}
                    players={clientPlayers}
                    variant="next"
                    teamId={teamId}
                    currentUid={user?.uid ?? null}
                    commentsLabel={ta("viewComments")}
                  />
                </div>
              )}

              {pastActionsPage.actions.length > 0 && (
                <div className="space-y-2">
                  <h2 className="font-display text-lg font-bold">{tl("pastResults")}</h2>
                  <PastActionsFeed
                    teamId={teamId}
                    seasonId={selectedSeason.id}
                    players={clientPlayers}
                    initialActions={pastActionsPage.actions.map((action) =>
                      omit(action, "createdAt", "updatedAt"),
                    )}
                    initialCursor={pastActionsPage.nextCursor}
                    currentUid={user?.uid ?? null}
                  />
                </div>
              )}
            </>
          )}

          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold">{t("roster")}</h2>
            {players.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noPlayersYet")}</p>
            ) : (
              <RosterGrid players={players} currentUid={user?.uid ?? null} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
