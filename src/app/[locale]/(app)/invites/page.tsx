import { getTranslations } from "next-intl/server";

import { FollowInvitesList, type FollowInviteWithTeamName } from "@/components/teams/FollowInvitesList";
import { InvitesList, type InviteWithTeamName } from "@/components/teams/InvitesList";
import { getCurrentUser } from "@/lib/auth/session";
import { listPendingInvitesForEmail } from "@/lib/teams/admin-invite-repository";
import { listPendingInvitesForEmail as listPendingFollowInvitesForEmail } from "@/lib/teams/follow-invite-repository";
import { getTeam } from "@/lib/teams/team-repository";
import { omit } from "@/lib/utils/omit";

export default async function InvitesPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations("invites")]);

  const [invites, followInvites] = user?.email
    ? await Promise.all([
        listPendingInvitesForEmail(user.email),
        listPendingFollowInvitesForEmail(user.email),
      ])
    : [[], []];

  const [teams, followTeams] = await Promise.all([
    Promise.all(invites.map((invite) => getTeam(invite.teamId))),
    Promise.all(followInvites.map((invite) => getTeam(invite.teamId))),
  ]);
  const invitesWithTeamName: InviteWithTeamName[] = invites.map((invite, i) => ({
    ...omit(invite, "createdAt", "updatedAt"),
    teamName: teams[i]?.name ?? invite.teamId,
  }));
  const followInvitesWithTeamName: FollowInviteWithTeamName[] = followInvites.map((invite, i) => ({
    ...omit(invite, "createdAt", "updatedAt"),
    teamName: followTeams[i]?.name ?? invite.teamId,
  }));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">{t("title")}</h1>
      {invitesWithTeamName.length === 0 && followInvitesWithTeamName.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noneTitle")}</p>
      ) : (
        <>
          <InvitesList invites={invitesWithTeamName} />
          <FollowInvitesList invites={followInvitesWithTeamName} />
        </>
      )}
    </div>
  );
}
