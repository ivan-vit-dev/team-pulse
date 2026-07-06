import type { Timestamp } from "firebase-admin/firestore";

export type ActionType = "match" | "training" | "tournament" | "cup" | "other";

export interface ActionResult {
  ourScore: number;
  theirScore: number;
}

export interface Action {
  id: string;
  teamId: string;
  seasonId: string;
  type: ActionType;
  title: string;
  competition: string | null;
  /** ISO date string (yyyy-mm-dd), same convention as Player.birthdate. */
  date: string;
  /** ISO time string (HH:mm), or null if no specific kickoff time is set. */
  time: string | null;
  location: string | null;
  /** Only meaningful for match-like types; null for training/other. */
  isHome: boolean | null;
  /** Only ever populated for type === "match" in this phase's UI. */
  result: ActionResult | null;
  /** Subset of the team's player ids called up to this action. */
  squadPlayerIds: string[];
  notes: string | null;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
