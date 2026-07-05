import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { PlayerForm } from "@/components/players/PlayerForm";
import { requireUid } from "@/lib/auth/require-uid";
import { isTeamAdmin } from "@/lib/teams/team-repository";

export default async function NewPlayerPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const uid = await requireUid();
  if (!(await isTeamAdmin(teamId, uid))) {
    notFound();
  }

  const t = await getTranslations("teams");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-2xl font-bold">{t("addPlayer")}</h1>
      <PlayerForm teamId={teamId} />
    </div>
  );
}
