import { getTranslations } from "next-intl/server";

import { TeamsDirectoryGrid } from "@/components/teams/TeamsDirectoryGrid";
import { getCurrentUser } from "@/lib/auth/session";
import { listAllTeams } from "@/lib/teams/team-repository";
import { omit } from "@/lib/utils/omit";

export default async function TeamsDirectoryPage() {
  const [teams, user, t] = await Promise.all([
    listAllTeams(),
    getCurrentUser(),
    getTranslations("teams"),
  ]);

  const clientSafeTeams = teams.map((team) => omit(team, "createdAt", "updatedAt"));

  return (
    <div className="space-y-2">
      <h1 className="font-impact text-4xl uppercase">{t("browseTeams")}</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">{t("browseDescription")}</p>
      <div className="pt-4">
        <TeamsDirectoryGrid
          teams={clientSafeTeams}
          currentUid={user?.uid ?? null}
          followedTeamIds={user?.followedTeamIds ?? []}
        />
      </div>
    </div>
  );
}
