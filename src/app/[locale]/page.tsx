import { CalendarDays, ShieldCheck, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AdminTeamsPanel } from "@/components/home/AdminTeamsPanel";
import { FollowedTeamsFeed, type FeedEntry } from "@/components/home/FollowedTeamsFeed";
import { RecentTeamsPanel } from "@/components/teams/RecentTeamsPanel";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { listUpcomingActionsForSeason } from "@/lib/actions/action-repository";
import { getCurrentUser } from "@/lib/auth/session";
import { getActiveSeason } from "@/lib/seasons/season-repository";
import { getTeamsByIds, listRecentTeams, listTeamsForAdmin } from "@/lib/teams/team-repository";
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
    const [followedTeams, adminTeams] = await Promise.all([
      getTeamsByIds(user.followedTeamIds),
      listTeamsForAdmin(user.uid),
    ]);
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
    const clientSafeAdminTeams = adminTeams.map((team) => omit(team, "createdAt", "updatedAt"));

    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 lg:flex-row lg:items-start lg:gap-8 lg:py-14">
        <div className="flex flex-1 flex-col items-center gap-6 lg:items-start">
          <h1 className="font-display text-2xl font-bold">{th("title")}</h1>
          {entries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
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
        <AdminTeamsPanel teams={clientSafeAdminTeams} />
      </div>
    );
  }

  const recentTeams = await listRecentTeams(9);
  const clientSafeTeams = recentTeams.map((team) => omit(team, "createdAt", "updatedAt"));

  const features = [
    {
      icon: CalendarDays,
      title: th("featureTimelineTitle"),
      description: th("featureTimelineDescription"),
    },
    {
      icon: Users,
      title: th("featureCommunityTitle"),
      description: th("featureCommunityDescription"),
    },
    {
      icon: ShieldCheck,
      title: th("featurePrivacyTitle"),
      description: th("featurePrivacyDescription"),
    },
  ];

  return (
    <div className="gradient-hero bg-pitch-lines bg-grain relative overflow-hidden px-6 py-10 sm:py-14 lg:py-12">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col items-start gap-5 text-left">
          <span
            className="font-display hidden items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider sm:inline-flex"
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
            {th("heroEyebrow")}
          </span>
          <h1 className="font-impact max-w-xl text-5xl leading-[0.95] uppercase sm:text-6xl lg:text-7xl">
            {th("heroTitleLine1")}
            <br />
            <span className="gradient-text">{th("heroTitleLine2")}</span>
          </h1>
          <p className="max-w-md text-base text-muted-foreground sm:text-lg">{th("heroSubtitle")}</p>
          <p className="hidden max-w-md text-sm text-muted-foreground lg:block">{th("heroDescription")}</p>

          <ul className="hidden w-full max-w-md flex-col gap-3 lg:flex">
            {features.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: "color-mix(in oklch, var(--primary) 14%, transparent)",
                    color: "var(--primary)",
                  }}
                >
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="gradient-brand" render={<Link href="/register">{t("signUp")}</Link>} />
            <Button size="lg" variant="outline" render={<Link href="/login">{t("signIn")}</Link>} />
          </div>
        </div>

        <RecentTeamsPanel teams={clientSafeTeams} />
      </div>
    </div>
  );
}
