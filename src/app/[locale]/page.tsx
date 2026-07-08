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
  const [user, t, th, ta, tl] = await Promise.all([
    getCurrentUser(),
    getTranslations("auth"),
    getTranslations("home"),
    getTranslations("actions"),
    getTranslations("timeline"),
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
          <FollowedTeamsFeed
            entries={entries}
            noUpcomingActionsLabel={th("noUpcomingActions")}
            commentsLabel={ta("viewComments")}
            nextLabel={tl("next")}
            currentUid={user.uid}
          />
        )}
      </div>
    );
  }

  return (
    <div className="gradient-hero bg-pitch-lines bg-grain relative flex flex-col items-center gap-7 overflow-hidden px-6 py-28 text-center sm:py-36">
      <span
        className="font-display inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider"
        style={{
          color: "var(--floodlight)",
          borderColor: "color-mix(in oklch, var(--floodlight) 40%, transparent)",
          background: "color-mix(in oklch, var(--floodlight) 14%, transparent)",
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--destructive)" }}
          aria-hidden="true"
        />
        Every matchday, pitch-side
      </span>
      <h1 className="font-impact max-w-3xl text-6xl leading-[0.95] uppercase sm:text-8xl">
        Your team.
        <br />
        <span className="gradient-text">Every match.</span>
      </h1>
      <p className="max-w-md text-lg text-muted-foreground">
        Follow your team&apos;s season — matches, trainings, and the moments that matter.
      </p>
      <div className="flex gap-3">
        <Button size="lg" className="gradient-brand" render={<Link href="/register">{t("signUp")}</Link>} />
        <Button size="lg" variant="outline" render={<Link href="/login">{t("signIn")}</Link>} />
      </div>
    </div>
  );
}
