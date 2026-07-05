import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AdminList, type AdminSummary } from "@/components/teams/AdminList";
import { EditTeamForm } from "@/components/teams/EditTeamForm";
import { InviteAdminForm } from "@/components/teams/InviteAdminForm";
import { PendingInvitesList } from "@/components/teams/PendingInvitesList";
import { TeamLogoUploader } from "@/components/teams/TeamLogoUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PlayerAdminList } from "@/components/players/PlayerAdminList";
import { Link } from "@/i18n/navigation";
import { requireUid } from "@/lib/auth/require-uid";
import { listPlayersForTeamWithPrivate } from "@/lib/players/player-repository";
import { listInvitesForTeam } from "@/lib/teams/admin-invite-repository";
import { getTeam, isTeamAdmin } from "@/lib/teams/team-repository";
import { getUserProfile } from "@/lib/users/user-repository";
import { omit } from "@/lib/utils/omit";

export default async function TeamAdminPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const uid = await requireUid();

  const team = await getTeam(teamId);
  if (!team || !(await isTeamAdmin(teamId, uid))) {
    notFound();
  }

  const [t, adminProfiles, invites, players] = await Promise.all([
    getTranslations("teams"),
    Promise.all(team.adminUids.map((adminUid) => getUserProfile(adminUid))),
    listInvitesForTeam(teamId),
    listPlayersForTeamWithPrivate(teamId),
  ]);

  const admins: AdminSummary[] = team.adminUids.map((adminUid, i) => ({
    uid: adminUid,
    displayName: adminProfiles[i]?.displayName ?? adminUid,
    email: adminProfiles[i]?.email ?? null,
  }));

  const clientTeam = omit(team, "createdAt", "updatedAt");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{team.name}</h1>
        <Button variant="outline" render={<Link href={`/teams/${teamId}`}>{t("viewTeamPage")}</Link>} />
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-bold">{t("logo")}</h2>
        </CardHeader>
        <CardContent>
          <TeamLogoUploader teamId={teamId} teamName={team.name} logoURL={team.logoURL} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-bold">{t("teamInfo")}</h2>
        </CardHeader>
        <CardContent>
          <EditTeamForm team={clientTeam} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-bold">{t("admins")}</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <AdminList teamId={teamId} admins={admins} />
          <InviteAdminForm teamId={teamId} />
          <PendingInvitesList
            teamId={teamId}
            invites={invites.map((invite) => omit(invite, "createdAt", "updatedAt"))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-display text-lg font-bold">{t("roster")}</h2>
          <Button
            size="sm"
            render={<Link href={`/teams/${teamId}/admin/players/new`}>{t("addPlayer")}</Link>}
          />
        </CardHeader>
        <CardContent>
          <PlayerAdminList
            teamId={teamId}
            players={players.map((player) => omit(player, "createdAt", "updatedAt"))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
