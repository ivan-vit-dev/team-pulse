import { getReadableTextColor } from "@/lib/utils/color";

interface TeamWithColors {
  colors: { primary: string; secondary: string } | null;
}

// Teams without custom brand colors still get a distinct avatar shade by
// rotating through the app's existing action-type tokens instead of
// inventing new palette values.
const FALLBACK_ACCENTS = [
  "var(--action-match)",
  "var(--action-training)",
  "var(--action-tournament)",
  "var(--action-cup)",
  "var(--brand-accent)",
];

export function getTeamAccentColor(team: TeamWithColors, index: number): string {
  return team.colors?.primary ?? FALLBACK_ACCENTS[index % FALLBACK_ACCENTS.length];
}

export function getTeamAvatarTextColor(team: TeamWithColors): string {
  return team.colors?.primary ? getReadableTextColor(team.colors.primary) : "#ffffff";
}

// One shared tile shade (kit-navy tinted, not the app's turf-green primary)
// — team identity lives in the avatar/border/chip, not the tile fill.
export const TEAM_TILE_BACKGROUND = "color-mix(in oklch, var(--brand-accent) 7%, var(--card))";
