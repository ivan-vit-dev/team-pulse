import { getTranslations } from "next-intl/server";

import { FollowedTeamsFeed, type FeedEntry } from "@/components/home/FollowedTeamsFeed";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { listUpcomingActionsForSeason } from "@/lib/actions/action-repository";
import { getCurrentUser } from "@/lib/auth/session";
import { getActiveSeason } from "@/lib/seasons/season-repository";
import { getTeamsByIds } from "@/lib/teams/team-repository";
import { omit } from "@/lib/utils/omit";

export default async function LandingPage() {
  const [user, t, th] = await Promise.all([
    getCurrentUser(),
    getTranslations("auth"),
    getTranslations("home"),
  ]);

  if (user) {
    const followedTeams = await getTeamsByIds(user.followedTeamIds);
    const entries: FeedEntry[] = await Promise.all(
      followedTeams.map(async (team) => {
        const activeSeason = await getActiveSeason(team.id);
        const nextAction = activeSeason
          ? (await listUpcomingActionsForSeason(activeSeason.id))[0] ?? null
          : null;
        return {
          team,
          nextAction: nextAction ? omit(nextAction, "createdAt", "updatedAt") : null,
        };
      }),
    );

    return (
      <div className="flex flex-col items-center gap-6 px-6 py-16">
        <h1 className="font-display text-2xl font-bold">{th("title")}</h1>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-muted-foreground">{th("noFollowedTeams")}</p>
            <Button className="gradient-brand" render={<Link href="/teams">{th("discoverTeams")}</Link>} />
          </div>
        ) : (
          <FollowedTeamsFeed entries={entries} noUpcomingActionsLabel={th("noUpcomingActions")} />
        )}
      </div>
    );
  }

  return (
    <div className="gradient-hero flex flex-col items-center gap-6 px-6 py-24 text-center">
      <h1 className="gradient-text font-display text-5xl font-bold uppercase tracking-wide">
        TeamPulse
      </h1>
      <p className="max-w-md text-muted-foreground">
        Follow your team&apos;s season — matches, trainings, and the moments that matter.
      </p>
      <div className="flex gap-3">
        <Button size="lg" className="gradient-brand" render={<Link href="/register">{t("signUp")}</Link>} />
        <Button size="lg" variant="outline" render={<Link href="/login">{t("signIn")}</Link>} />
      </div>
    </div>
  );
}
