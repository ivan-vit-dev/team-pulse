import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { SeasonForm } from "@/components/seasons/SeasonForm";
import { requireUid } from "@/lib/auth/require-uid";
import { getSeason } from "@/lib/seasons/season-repository";
import { isTeamAdmin } from "@/lib/teams/team-repository";
import { omit } from "@/lib/utils/omit";

export default async function EditSeasonPage({
  params,
}: {
  params: Promise<{ teamId: string; seasonId: string }>;
}) {
  const { teamId, seasonId } = await params;
  const uid = await requireUid();
  if (!(await isTeamAdmin(teamId, uid))) {
    notFound();
  }

  const [season, t] = await Promise.all([getSeason(seasonId), getTranslations("seasons")]);
  if (!season || season.teamId !== teamId) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-2xl font-bold">{t("editSeason")}</h1>
      <SeasonForm teamId={teamId} season={omit(season, "createdAt", "updatedAt")} />
    </div>
  );
}
