import { getTranslations } from "next-intl/server";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation";
import type { Team } from "@/lib/types/team";

export async function FollowedTeamsList({ teams }: { teams: Team[] }) {
  const t = await getTranslations("profile");

  if (teams.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noTeamsYet")}</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {teams.map((team) => (
        <Link
          key={team.id}
          href={`/teams/${team.id}`}
          className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent"
        >
          <Avatar className="h-10 w-10 rounded-lg">
            {team.logoURL && <AvatarImage src={team.logoURL} alt="" />}
            <AvatarFallback className="rounded-lg">
              {team.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-display font-bold">{team.name}</p>
            <p className="text-xs text-muted-foreground">
              {team.category}
              {team.club ? ` · ${team.club}` : ""}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
