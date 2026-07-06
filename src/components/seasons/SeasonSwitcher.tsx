"use client";

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
  const router = useRouter();

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
          {(value: string) => seasons.find((season) => season.id === value)?.name ?? value}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {seasons.map((season) => (
          <SelectItem key={season.id} value={season.id}>
            {season.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
