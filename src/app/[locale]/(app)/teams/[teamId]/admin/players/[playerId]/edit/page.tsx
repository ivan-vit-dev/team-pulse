import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { PlayerForm } from "@/components/players/PlayerForm";
import { requireUid } from "@/lib/auth/require-uid";
import { getPlayerWithPrivate } from "@/lib/players/player-repository";
import { isTeamAdmin } from "@/lib/teams/team-repository";
import { omit } from "@/lib/utils/omit";

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ teamId: string; playerId: string }>;
}) {
  const { teamId, playerId } = await params;
  const uid = await requireUid();
  if (!(await isTeamAdmin(teamId, uid))) {
    notFound();
  }

  const [player, t] = await Promise.all([
    getPlayerWithPrivate(playerId),
    getTranslations("teams"),
  ]);
  if (!player || player.teamId !== teamId) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-2xl font-bold">{t("editPlayer")}</h1>
      <PlayerForm teamId={teamId} player={omit(player, "createdAt", "updatedAt")} />
    </div>
  );
}
