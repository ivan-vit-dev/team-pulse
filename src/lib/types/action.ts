import type { Timestamp } from "firebase-admin/firestore";

export type ActionType = "match" | "training" | "tournament" | "cup" | "other";

export type ReactionType = "great" | "fire" | "applause" | "love" | "laugh";

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
  /** Only meaningful for match-like types (match/tournament/cup); null for
   *  training/other. Absent on actions created before this field existed —
   *  read via `action.opponent ?? null`. */
  opponent: string | null;
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
  /** Renamed from `notes` (full replace, pre-launch — the old field was never
   *  displayed anywhere). Absent on actions created while the field was still
   *  called `notes` — read via `action.description ?? null`. */
  description: string | null;
  /** uid -> the one reaction that user has on this action (picking a new one
   * replaces the old, Facebook-style). Absent on actions created before this
   * field existed — always read via `action.reactions ?? {}`. */
  reactions: Record<string, ReactionType>;
  createdBy: string;
  /** Uid of whoever last edited this action — lets onActionUpdated exclude
   * the editor from their own "action updated" notification, the same way
   * createdBy excludes the creator from onActionCreated. Absent on actions
   * updated before this field existed; read via `action.updatedBy ?? null`. */
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
