import { getTranslations } from "next-intl/server";

import { InvitesList, type InviteWithTeamName } from "@/components/teams/InvitesList";
import { getCurrentUser } from "@/lib/auth/session";
import { listPendingInvitesForEmail } from "@/lib/teams/admin-invite-repository";
import { getTeam } from "@/lib/teams/team-repository";
import { omit } from "@/lib/utils/omit";

export default async function InvitesPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations("invites")]);

  const invites = user?.email ? await listPendingInvitesForEmail(user.email) : [];
  const teams = await Promise.all(invites.map((invite) => getTeam(invite.teamId)));
  const invitesWithTeamName: InviteWithTeamName[] = invites.map((invite, i) => ({
    ...omit(invite, "createdAt", "updatedAt"),
    teamName: teams[i]?.name ?? invite.teamId,
  }));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">{t("title")}</h1>
      <InvitesList invites={invitesWithTeamName} />
    </div>
  );
}
