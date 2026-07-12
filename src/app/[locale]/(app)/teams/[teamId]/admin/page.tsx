import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { ActionAdminList } from "@/components/actions/ActionAdminList";
import { AdminList, type AdminSummary } from "@/components/teams/AdminList";
import { EditTeamForm } from "@/components/teams/EditTeamForm";
import { InviteAdminForm } from "@/components/teams/InviteAdminForm";
import { InviteFanForm } from "@/components/teams/InviteFanForm";
import { PendingFollowInvitesList } from "@/components/teams/PendingFollowInvitesList";
import { PendingInvitesList } from "@/components/teams/PendingInvitesList";
import { ShareFollowLinkButton } from "@/components/teams/ShareFollowLinkButton";
import { ReportsAdminList, type ReportSummary } from "@/components/reports/ReportsAdminList";
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
import { buildReportPreview } from "@/lib/reports/report-preview";
import { listReportsForTeam } from "@/lib/reports/report-repository";
import { listSeasonsForTeam } from "@/lib/seasons/season-repository";
import { listInvitesForTeam } from "@/lib/teams/admin-invite-repository";
import { listInvitesForTeam as listFollowInvitesForTeam } from "@/lib/teams/follow-invite-repository";
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

  const [t, ts, ta, tr, adminProfiles, invites, followInvites, players, seasons, reports] =
    await Promise.all([
      getTranslations("teams"),
      getTranslations("seasons"),
      getTranslations("actions"),
      getTranslations("reports"),
      Promise.all(team.adminUids.map((adminUid) => getUserProfile(adminUid))),
      listInvitesForTeam(teamId),
      listFollowInvitesForTeam(teamId),
      listPlayersForTeamWithPrivate(teamId),
      listSeasonsForTeam(teamId),
      listReportsForTeam(teamId),
    ]);

  const pendingReports = reports.filter((report) => report.status === "pending");
  const reportSummaries: ReportSummary[] = await Promise.all(
    pendingReports.map(async (report) => {
      const preview = await buildReportPreview(teamId, report);
      return {
        id: report.id,
        contentType: report.contentType,
        reason: report.reason,
        details: report.details,
        createdAt: report.createdAt.toDate().toISOString(),
        previewLabel: preview.label,
        previewHref: preview.href,
      };
    }),
  );

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
      {/* Identity block: logo + name + quick stats, one richer surface
          instead of a plain header row + a separate logo card. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div
          className="relative overflow-hidden rounded-2xl border p-6 lg:col-span-2"
          style={{
            borderColor: "color-mix(in oklch, var(--brand-accent) 35%, var(--border))",
            background:
              "radial-gradient(120% 140% at 100% 0%, color-mix(in oklch, var(--brand-accent) 14%, transparent), transparent 60%), var(--card)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TeamLogoUploader teamId={teamId} teamName={team.name} logoURL={team.logoURL} />
            <div className="flex gap-2">
              <ShareFollowLinkButton teamId={teamId} teamName={team.name} />
              <Button
                variant="outline"
                render={<Link href={`/teams/${teamId}`}>{t("viewTeamPage")}</Link>}
              />
            </div>
          </div>
          <h1 className="font-impact mt-5 text-4xl uppercase">{team.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {team.category}
            {team.club ? ` · ${team.club}` : ""}
            {team.location ? ` · ${team.location}` : ""}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("admins")}
            </p>
            <p className="font-impact mt-1 text-3xl">{admins.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("roster")}
            </p>
            <p className="font-impact mt-1 text-3xl">{players.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-display text-lg font-bold">{t("teamInfo")}</h2>
          </CardHeader>
          <CardContent>
            <EditTeamForm team={clientTeam} />
          </CardContent>
        </Card>

        <div className="space-y-6">
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
            <CardHeader>
              <h2 className="font-display text-lg font-bold">{t("fans")}</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <InviteFanForm teamId={teamId} />
              <PendingFollowInvitesList
                teamId={teamId}
                invites={followInvites.map((invite) => omit(invite, "createdAt", "updatedAt"))}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-bold">{tr("title")}</h2>
        </CardHeader>
        <CardContent>
          <ReportsAdminList reports={reportSummaries} />
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

      <div className="grid gap-6 lg:grid-cols-3">
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

        <Card className="lg:col-span-2">
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
            {selectedSeason && !selectedSeason.isArchived && (
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
                seasonArchived={selectedSeason.isArchived}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{ta("noActiveSeason")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
