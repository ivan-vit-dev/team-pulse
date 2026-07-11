/**
 * Picks black or white text for a given background hex color using WCAG-style
 * relative luminance — for wherever a user-supplied team color (SRS FR-10/
 * FR-12) becomes a solid background and we can't assume it's dark enough for
 * light text (e.g. white team colors).
 */
export function getReadableTextColor(hex: string): "#0a0a0a" | "#ffffff" {
  const normalized = hex.replace("#", "");
  const full = normalized.length === 3 ? normalized.split("").map((ch) => ch + ch).join("") : normalized;
  if (full.length !== 6 || Number.isNaN(Number.parseInt(full, 16))) return "#ffffff";

  const toLinear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const r = toLinear(Number.parseInt(full.slice(0, 2), 16));
  const g = toLinear(Number.parseInt(full.slice(2, 4), 16));
  const b = toLinear(Number.parseInt(full.slice(4, 6), 16));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  return luminance > 0.45 ? "#0a0a0a" : "#ffffff";
}
