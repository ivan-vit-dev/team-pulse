"use client";

import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import type { Season } from "@/lib/types/season";

type ClientSafeSeason = Omit<Season, "createdAt" | "updatedAt">;

interface SeasonSwitcherProps {
  teamId: string;
  seasons: ClientSafeSeason[];
  selectedSeasonId: string;
  basePath?: string;
}

export function SeasonSwitcher({
  teamId,
  seasons,
  selectedSeasonId,
  basePath,
}: SeasonSwitcherProps) {
  const t = useTranslations("seasons");
  const router = useRouter();

  function seasonLabel(season: ClientSafeSeason): string {
    return season.isArchived ? `${season.name} (${t("archived")})` : season.name;
  }

  return (
    <Select
      value={selectedSeasonId}
      onValueChange={(value: string | null) => {
        if (!value) return;
        router.push(`${basePath ?? `/teams/${teamId}/admin`}?season=${value}`);
      }}
    >
      <SelectTrigger size="sm">
        {/* Select.Value doesn't auto-resolve a label from the matching
            SelectItem's children — it needs an explicit render function. */}
        <SelectValue>
          {(value: string) => {
            const season = seasons.find((s) => s.id === value);
            return season ? seasonLabel(season) : value;
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {seasons.map((season) => (
          <SelectItem key={season.id} value={season.id}>
            {seasonLabel(season)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
