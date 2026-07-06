import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/actions/ActionForm";
import { requireUid } from "@/lib/auth/require-uid";
import { listPlayersForTeam } from "@/lib/players/player-repository";
import { getSeason } from "@/lib/seasons/season-repository";
import { isTeamAdmin } from "@/lib/teams/team-repository";

export default async function NewActionPage({
  params,
}: {
  params: Promise<{ teamId: string; seasonId: string }>;
}) {
  const { teamId, seasonId } = await params;
  const uid = await requireUid();
  if (!(await isTeamAdmin(teamId, uid))) {
    notFound();
  }

  const [season, players, t] = await Promise.all([
    getSeason(seasonId),
    listPlayersForTeam(teamId),
    getTranslations("actions"),
  ]);
  if (!season || season.teamId !== teamId) {
    notFound();
  }

  const roster = players.map((player) => ({
    id: player.id,
    displayName: player.displayName,
    jerseyNumber: player.jerseyNumber,
  }));

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-2xl font-bold">{t("addAction")}</h1>
      <ActionForm teamId={teamId} seasonId={seasonId} roster={roster} />
    </div>
  );
}
