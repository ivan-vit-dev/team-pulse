import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { RosterGrid } from "@/components/players/RosterGrid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listPlayersForTeam } from "@/lib/players/player-repository";
import { getTeam } from "@/lib/teams/team-repository";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const team = await getTeam(teamId);
  if (!team) {
    notFound();
  }

  const [players, user, t] = await Promise.all([
    listPlayersForTeam(teamId),
    getCurrentUser(),
    getTranslations("teams"),
  ]);

  const isAdmin = user !== null && team.adminUids.includes(user.uid);
  const teamScopeStyle = team.colors
    ? ({
        "--team-primary": team.colors.primary,
        "--team-secondary": team.colors.secondary,
      } as React.CSSProperties)
    : undefined;

  return (
    <div className="team-scope space-y-6" style={teamScopeStyle}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 rounded-lg" size="lg">
            {team.logoURL && <AvatarImage src={team.logoURL} alt="" />}
            <AvatarFallback className="rounded-lg">
              {team.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-display text-2xl font-bold">{team.name}</h1>
            <p className="text-sm text-muted-foreground">
              {team.category}
              {team.club ? ` · ${team.club}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {team.location} · {team.homePitch}
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button variant="outline" render={<Link href={`/teams/${teamId}/admin`}>{t("adminDashboard")}</Link>} />
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-bold">{t("roster")}</h2>
        {players.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noPlayersYet")}</p>
        ) : (
          <RosterGrid players={players} />
        )}
      </div>
    </div>
  );
}
