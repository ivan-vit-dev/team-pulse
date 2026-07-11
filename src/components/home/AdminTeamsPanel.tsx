"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Team } from "@/lib/types/team";
import { cn } from "@/lib/utils";

export type ClientSafeTeam = Omit<Team, "createdAt" | "updatedAt">;

interface AdminTeamsPanelProps {
  teams: ClientSafeTeam[];
}

export function AdminTeamsPanel({ teams }: AdminTeamsPanelProps) {
  const t = useTranslations("teams");
  const [expanded, setExpanded] = useState(false);

  const countBadge = teams.length > 0 && (
    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground">
      {teams.length}
    </span>
  );

  const createTeamButton = (
    <Button
      size="sm"
      variant="outline"
      className="shrink-0"
      render={<Link href="/teams/new">{t("createTeam")}</Link>}
    />
  );

  function renderTeamList(showCreateCta: boolean) {
    if (teams.length === 0) {
      return (
        <div className="space-y-3 text-center">
          <p className="text-sm text-muted-foreground">{t("noTeamsYet")}</p>
          {showCreateCta && (
            <Button
              size="sm"
              className="gradient-brand w-full"
              render={<Link href="/teams/new">{t("createTeam")}</Link>}
            />
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {teams.map((team) => (
          <div key={team.id} className="rounded-xl border p-3">
            <p className="font-display text-sm font-bold">{team.name}</p>
            <p className="text-xs text-muted-foreground">{team.category}</p>
            <div className="mt-2 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                render={<Link href={`/teams/${team.id}`}>{t("viewTeamPage")}</Link>}
              />
              <Button
                size="sm"
                className="flex-1"
                render={<Link href={`/teams/${team.id}/admin`}>{t("adminDashboard")}</Link>}
              />
            </div>
          </div>
        ))}
        {showCreateCta && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            render={<Link href="/teams/new">{t("createTeam")}</Link>}
          />
        )}
      </div>
    );
  }

  return (
    <>
      {/* Below lg: one column, always visible — just a distinctly styled
          section below the followed-teams feed, not a collapsible toggle. */}
      <div className="glass w-full rounded-2xl border p-4 lg:hidden">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-display font-bold">{t("myTeams")}</h2>
            {countBadge}
          </div>
          {createTeamButton}
        </div>
        {renderTeamList(false)}
      </div>

      {/* lg and up: a real side column that slides open/closed horizontally,
          collapsing to a slim vertical rail instead of just hiding a panel. */}
      <div className="hidden shrink-0 items-stretch lg:flex">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-label={t("myTeams")}
          className="glass flex w-9 shrink-0 flex-col items-center gap-2 self-stretch rounded-2xl border py-4 transition-colors hover:bg-muted"
        >
          {expanded ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
          <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {teams.length > 0 && (
            <span className="rounded-full bg-muted px-1 py-0.5 text-[10px] font-bold text-muted-foreground">
              {teams.length}
            </span>
          )}
          <span className="font-display mt-1 text-xs font-bold tracking-wide text-muted-foreground [writing-mode:vertical-rl]">
            {t("myTeams")}
          </span>
        </button>

        <div
          className={cn(
            "shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out",
            expanded ? "w-72" : "w-0",
          )}
        >
          <div className="glass ml-2 w-72 rounded-2xl border p-4">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="font-display font-bold">{t("myTeams")}</span>
              {countBadge}
            </div>
            {renderTeamList(true)}
          </div>
        </div>
      </div>
    </>
  );
}
