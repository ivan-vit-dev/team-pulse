import type { ReactionType } from "@/lib/types/action";

export const REACTION_TYPES: ReactionType[] = ["great", "fire", "applause", "love", "laugh"];

export const REACTION_EMOJI: Record<ReactionType, string> = {
  great: "⚽",
  fire: "🔥",
  applause: "👏",
  love: "❤️",
  laugh: "😂",
};

export function getReactionCounts(
  reactions: Record<string, ReactionType>,
): Partial<Record<ReactionType, number>> {
  const counts: Partial<Record<ReactionType, number>> = {};
  for (const type of Object.values(reactions)) {
    counts[type] = (counts[type] ?? 0) + 1;
  }
  return counts;
}
