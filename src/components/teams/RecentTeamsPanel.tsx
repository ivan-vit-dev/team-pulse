"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import type { Team } from "@/lib/types/team";
import { getTeamAccentColor, getTeamAvatarTextColor, TEAM_TILE_BACKGROUND } from "@/lib/utils/teamAccent";

export type ClientSafeTeam = Omit<Team, "createdAt" | "updatedAt">;

interface RecentTeamsPanelProps {
  teams: ClientSafeTeam[];
}

export function RecentTeamsPanel({ teams }: RecentTeamsPanelProps) {
  const t = useTranslations("home");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(
      (team) => team.name.toLowerCase().includes(q) || (team.club ?? "").toLowerCase().includes(q),
    );
  }, [teams, query]);

  return (
    <div className="glass w-full rounded-2xl border p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span
            className="font-display mb-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
            style={{ color: "var(--floodlight)" }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--floodlight)" }}
              aria-hidden="true"
            />
            {t("recentTeamsEyebrow")}
          </span>
          <h2 className="font-display text-xl font-bold">{t("recentTeamsTitle")}</h2>
        </div>
        <Button
          size="sm"
          className="gradient-brand shrink-0 border-none text-primary-foreground hover:opacity-90"
          render={<Link href="/teams">{t("seeAllTeams")}</Link>}
        />
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          name="teamSearch"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchTeamsPlaceholder")}
          aria-label={t("searchTeamsPlaceholder")}
          autoComplete="off"
          className="h-10 pl-9"
          // Base UI's Input sets an internal caret-color style after mount
          // that legitimately differs from its SSR output on this specific
          // controlled-value usage — harmless, doesn't affect rendering.
          suppressHydrationWarning
        />
      </div>

      {/* Divider — the panel's only "glow", a thin accent line instead of an
          ambient shadow around the whole card. */}
      <div
        className="my-4 h-px w-full"
        style={{
          background: "linear-gradient(90deg, transparent, var(--primary), var(--floodlight), transparent)",
          boxShadow: "0 0 8px color-mix(in oklch, var(--primary) 45%, transparent)",
        }}
        aria-hidden="true"
      />

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {teams.length === 0 ? t("noTeamsYet") : t("noTeamsFound")}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {filtered.map((team, index) => {
            const accent = getTeamAccentColor(team, index);
            const avatarTextColor = getTeamAvatarTextColor(team);

            return (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                aria-label={t("viewTeam", { name: team.name })}
                className="animate-timeline-in group/tile flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:brightness-110"
                style={{
                  animationDelay: `${index * 40}ms`,
                  animationFillMode: "backwards",
                  background: TEAM_TILE_BACKGROUND,
                  borderColor: `color-mix(in oklch, ${accent} 32%, var(--border))`,
                }}
              >
                <Avatar
                  className="h-10 w-10 rounded-lg transition-transform duration-200 group-hover/tile:scale-110"
                  style={{ boxShadow: `0 0 0 2px color-mix(in oklch, ${accent} 45%, transparent)` }}
                >
                  {team.logoURL && <AvatarImage src={team.logoURL} alt="" />}
                  <AvatarFallback className="rounded-lg" style={{ background: accent, color: avatarTextColor }}>
                    {team.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="w-full min-w-0">
                  <p className="font-display line-clamp-2 text-xs leading-tight font-bold">{team.name}</p>
                  <span
                    className="mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase"
                    style={{
                      background: `color-mix(in oklch, ${accent} 16%, transparent)`,
                      color: `color-mix(in oklch, ${accent} 65%, var(--foreground))`,
                    }}
                  >
                    {team.category}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
