import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { ActionAdminList } from "@/components/actions/ActionAdminList";
import { AdminList, type AdminSummary } from "@/components/teams/AdminList";
import { EditTeamForm } from "@/components/teams/EditTeamForm";
import { InviteAdminForm } from "@/components/teams/InviteAdminForm";
import { PendingInvitesList } from "@/components/teams/PendingInvitesList";
import { SeasonAdminList } from "@/components/seasons/SeasonAdminList";
import { SeasonSwitcher } from "@/components/seasons/SeasonSwitcher";
import { TeamLogoUploader } from "@/components/teams/TeamLogoUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PlayerAdminList } from "@/components/players/PlayerAdminList";
import { Link } from "@/i18n/navigation";
import { listActionsForSeason } from "@/lib/actions/action-repository";
import { requireUid } from "@/lib/auth/require-uid";
import { listPlayersForTeamWithPrivate } from "@/lib/players/player-repository";
import { listSeasonsForTeam } from "@/lib/seasons/season-repository";
import { listInvitesForTeam } from "@/lib/teams/admin-invite-repository";
import { getTeam, isTeamAdmin } from "@/lib/teams/team-repository";
import { getUserProfile } from "@/lib/users/user-repository";
import { omit } from "@/lib/utils/omit";

export default async function TeamAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const { teamId } = await params;
  const { season: seasonParam } = await searchParams;
  const uid = await requireUid();

  const team = await getTeam(teamId);
  if (!team || !(await isTeamAdmin(teamId, uid))) {
    notFound();
  }

  const [t, ts, ta, adminProfiles, invites, players, seasons] = await Promise.all([
    getTranslations("teams"),
    getTranslations("seasons"),
    getTranslations("actions"),
    Promise.all(team.adminUids.map((adminUid) => getUserProfile(adminUid))),
    listInvitesForTeam(teamId),
    listPlayersForTeamWithPrivate(teamId),
    listSeasonsForTeam(teamId),
  ]);

  const admins: AdminSummary[] = team.adminUids.map((adminUid, i) => ({
    uid: adminUid,
    displayName: adminProfiles[i]?.displayName ?? adminUid,
    email: adminProfiles[i]?.email ?? null,
  }));

  const clientTeam = omit(team, "createdAt", "updatedAt");

  const sortedSeasons = [...seasons].sort(
    (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis(),
  );
  const selectedSeason =
    sortedSeasons.find((season) => season.id === seasonParam) ??
    sortedSeasons.find((season) => season.isActive) ??
    sortedSeasons[0] ??
    null;
  const actionsForSeason = selectedSeason
    ? [...(await listActionsForSeason(selectedSeason.id))].sort((a, b) =>
        (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")),
      )
    : [];
  const clientSeasons = sortedSeasons.map((season) => omit(season, "createdAt", "updatedAt"));

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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-display text-lg font-bold">{ts("title")}</h2>
          <Button
            size="sm"
            render={<Link href={`/teams/${teamId}/admin/seasons/new`}>{ts("addSeason")}</Link>}
          />
        </CardHeader>
        <CardContent>
          <SeasonAdminList teamId={teamId} seasons={clientSeasons} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg font-bold">{ta("title")}</h2>
            {selectedSeason && (
              <SeasonSwitcher
                teamId={teamId}
                seasons={clientSeasons}
                selectedSeasonId={selectedSeason.id}
              />
            )}
          </div>
          {selectedSeason && (
            <Button
              size="sm"
              render={
                <Link href={`/teams/${teamId}/admin/seasons/${selectedSeason.id}/actions/new`}>
                  {ta("addAction")}
                </Link>
              }
            />
          )}
        </CardHeader>
        <CardContent>
          {selectedSeason ? (
            <ActionAdminList
              teamId={teamId}
              seasonId={selectedSeason.id}
              actions={actionsForSeason.map((action) => omit(action, "createdAt", "updatedAt"))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{ta("noActiveSeason")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
