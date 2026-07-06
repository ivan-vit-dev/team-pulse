import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getVerifiedUid } from "@/lib/auth/session";
import { listTeamsForAdmin } from "@/lib/teams/team-repository";

export default async function MyTeamsPage() {
  const uid = await getVerifiedUid();
  const [teams, t] = await Promise.all([
    uid ? listTeamsForAdmin(uid) : Promise.resolve([]),
    getTranslations("teams"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{t("myTeams")}</h1>
        <Button className="gradient-brand" render={<Link href="/teams/new">{t("createTeam")}</Link>} />
      </div>

      {teams.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noTeamsYet")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardContent className="space-y-2 pt-6">
                <h2 className="font-display text-lg font-bold">{team.name}</h2>
                <p className="text-sm text-muted-foreground">{team.category}</p>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/teams/${team.id}`}>{t("viewTeamPage")}</Link>}
                  />
                  <Button
                    size="sm"
                    render={<Link href={`/teams/${team.id}/admin`}>{t("adminDashboard")}</Link>}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
