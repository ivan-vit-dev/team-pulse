import { getTranslations } from "next-intl/server";

import { CreateTeamForm } from "@/components/teams/CreateTeamForm";

export default async function NewTeamPage() {
  const t = await getTranslations("teams");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-2xl font-bold">{t("createTeamTitle")}</h1>
      <CreateTeamForm />
    </div>
  );
}
