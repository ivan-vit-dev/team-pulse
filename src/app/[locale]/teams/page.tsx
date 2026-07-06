import { getTranslations } from "next-intl/server";

import { FollowButton } from "@/components/teams/FollowButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listAllTeams } from "@/lib/teams/team-repository";

export default async function TeamsDirectoryPage() {
  const [teams, user, t] = await Promise.all([
    listAllTeams(),
    getCurrentUser(),
    getTranslations("teams"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">{t("browseTeams")}</h1>

      {teams.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noTeamsAtAll")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardContent className="flex items-center gap-4 pt-6">
                <Avatar className="h-12 w-12 rounded-lg">
                  {team.logoURL && <AvatarImage src={team.logoURL} alt="" />}
                  <AvatarFallback className="rounded-lg">
                    {team.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <h2 className="font-display text-lg font-bold">{team.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {team.category}
                    {team.club ? ` · ${team.club}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">{team.location}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/teams/${team.id}`}>{t("viewTeamPage")}</Link>}
                  />
                  {user && (
                    <FollowButton
                      teamId={team.id}
                      initialIsFollowing={user.followedTeamIds.includes(team.id)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
