"use client";

import { useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { FollowButton } from "@/components/teams/FollowButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import type { Team } from "@/lib/types/team";
import { getTeamAccentColor, getTeamAvatarTextColor, TEAM_TILE_BACKGROUND } from "@/lib/utils/teamAccent";

export type ClientSafeTeam = Omit<Team, "createdAt" | "updatedAt">;

interface TeamsDirectoryGridProps {
  teams: ClientSafeTeam[];
  currentUid: string | null;
  followedTeamIds: string[];
}

export function TeamsDirectoryGrid({ teams, currentUid, followedTeamIds }: TeamsDirectoryGridProps) {
  const t = useTranslations("teams");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(
      (team) =>
        team.name.toLowerCase().includes(q) ||
        (team.club ?? "").toLowerCase().includes(q) ||
        team.category.toLowerCase().includes(q),
    );
  }, [teams, query]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          name="teamsDirectorySearch"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          autoComplete="off"
          className="h-10 pl-9"
          suppressHydrationWarning
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {teams.length === 0 ? t("noTeamsAtAll") : t("noTeamsMatchSearch")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((team, index) => {
            const accent = getTeamAccentColor(team, index);
            const avatarTextColor = getTeamAvatarTextColor(team);

            return (
              <div
                key={team.id}
                className="animate-timeline-in flex flex-col items-center gap-3 rounded-xl border p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:brightness-110"
                style={{
                  animationDelay: `${index * 30}ms`,
                  animationFillMode: "backwards",
                  background: TEAM_TILE_BACKGROUND,
                  borderColor: `color-mix(in oklch, ${accent} 32%, var(--border))`,
                }}
              >
                <Link href={`/teams/${team.id}`} className="group/tile flex w-full flex-col items-center gap-3">
                  <Avatar
                    className="h-14 w-14 rounded-lg transition-transform duration-200 group-hover/tile:scale-110"
                    style={{ boxShadow: `0 0 0 2px color-mix(in oklch, ${accent} 45%, transparent)` }}
                  >
                    {team.logoURL && <AvatarImage src={team.logoURL} alt="" />}
                    <AvatarFallback className="rounded-lg" style={{ background: accent, color: avatarTextColor }}>
                      {team.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="w-full min-w-0 text-center">
                    <p className="font-display line-clamp-2 text-sm leading-tight font-bold">{team.name}</p>
                    <span
                      className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase"
                      style={{
                        background: `color-mix(in oklch, ${accent} 16%, transparent)`,
                        color: `color-mix(in oklch, ${accent} 65%, var(--foreground))`,
                      }}
                    >
                      {team.category}
                    </span>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{team.location}</p>
                  </div>
                </Link>

                {currentUid &&
                  (team.adminUids.includes(currentUid) ? (
                    <Badge variant="secondary" className="mx-auto">
                      <ShieldCheck aria-hidden="true" />
                      {t("youManageThisTeam")}
                    </Badge>
                  ) : (
                    <FollowButton
                      teamId={team.id}
                      initialIsFollowing={followedTeamIds.includes(team.id)}
                      className="w-full"
                    />
                  ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
