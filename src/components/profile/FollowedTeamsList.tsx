import { getTranslations } from "next-intl/server";

export async function FollowedTeamsList({ teamIds }: { teamIds: string[] }) {
  const t = await getTranslations("profile");

  if (teamIds.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noTeamsYet")}</p>;
  }

  // Rendering followed teams themselves is out of scope until the Follow
  // System phase — this branch only exists so the component doesn't need
  // to change shape when that phase adds real team lookups.
  return <p className="text-sm text-muted-foreground">{teamIds.length} teams followed</p>;
}
