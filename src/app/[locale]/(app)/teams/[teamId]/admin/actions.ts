"use server";

import { z } from "zod";

import {
  createAction as createActionRepo,
  deleteAction as deleteActionRepo,
  getAction,
  updateAction as updateActionRepo,
} from "@/lib/actions/action-repository";
import { requireUid } from "@/lib/auth/require-uid";
import {
  getPlayerPublic,
  listPlayersForTeam,
  createPlayer as createPlayerRepo,
  deletePlayer as deletePlayerRepo,
  updatePlayer as updatePlayerRepo,
  updatePlayerAvatar as updatePlayerAvatarRepo,
} from "@/lib/players/player-repository";
import {
  createSeason as createSeasonRepo,
  deleteSeason as deleteSeasonRepo,
  getSeason,
  setActiveSeason as setActiveSeasonRepo,
  updateSeason as updateSeasonRepo,
} from "@/lib/seasons/season-repository";
import {
  createInvite,
  getInvite,
  revokeInvite as revokeInviteRepo,
} from "@/lib/teams/admin-invite-repository";
import {
  isTeamAdmin,
  removeTeamAdmin,
  updateTeam as updateTeamRepo,
} from "@/lib/teams/team-repository";

async function requireTeamAdmin(teamId: string): Promise<string> {
  const uid = await requireUid();
  if (!(await isTeamAdmin(teamId, uid))) {
    throw new Error("Not an admin of this team");
  }
  return uid;
}

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #1a2b3c");

const updateTeamSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(1),
  club: z.string().nullable(),
  location: z.string().min(1),
  homePitch: z.string().min(1),
  colors: z.object({ primary: hexColor, secondary: hexColor }).nullable(),
  socialLinks: z.object({
    website: z.url().optional().or(z.literal("")),
    facebook: z.url().optional().or(z.literal("")),
    instagram: z.url().optional().or(z.literal("")),
    twitter: z.url().optional().or(z.literal("")),
  }),
});

export async function updateTeamAction(
  teamId: string,
  input: z.infer<typeof updateTeamSchema>,
) {
  await requireTeamAdmin(teamId);
  const parsed = updateTeamSchema.parse(input);
  await updateTeamRepo(teamId, parsed);
}

export async function updateTeamLogoAction(teamId: string, logoURL: string) {
  await requireTeamAdmin(teamId);
  await updateTeamRepo(teamId, { logoURL });
}

const inviteAdminSchema = z.object({ email: z.email() });

export async function inviteAdminAction(teamId: string, input: { email: string }) {
  const uid = await requireTeamAdmin(teamId);
  const { email } = inviteAdminSchema.parse(input);
  await createInvite(teamId, email, uid);
}

export async function revokeInviteAction(teamId: string, inviteId: string) {
  await requireTeamAdmin(teamId);
  const invite = await getInvite(inviteId);
  if (!invite || invite.teamId !== teamId) {
    throw new Error("Invite not found for this team");
  }
  await revokeInviteRepo(inviteId);
}

export async function removeAdminAction(teamId: string, uidToRemove: string) {
  await requireTeamAdmin(teamId);
  await removeTeamAdmin(teamId, uidToRemove);
}

const playerSchema = z.object({
  displayName: z.string().min(1),
  jerseyNumber: z.number().int().min(0).max(99).nullable(),
  realName: z.string().min(1),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  avatarURL: z.string().nullable(),
});

export async function createPlayerAction(
  teamId: string,
  input: z.infer<typeof playerSchema>,
): Promise<{ playerId: string }> {
  await requireTeamAdmin(teamId);
  const parsed = playerSchema.parse(input);
  const playerId = await createPlayerRepo(teamId, parsed);
  return { playerId };
}

export async function updatePlayerAction(
  playerId: string,
  input: z.infer<typeof playerSchema>,
) {
  const player = await getPlayerPublic(playerId);
  if (!player) throw new Error("Player not found");
  // teamId is re-derived from the player record itself, never trusted from
  // the client, so a caller can't claim admin-of-team-B to edit a player
  // that actually belongs to team A.
  await requireTeamAdmin(player.teamId);
  const parsed = playerSchema.parse(input);
  await updatePlayerRepo(playerId, parsed);
}

export async function deletePlayerAction(playerId: string) {
  const player = await getPlayerPublic(playerId);
  if (!player) throw new Error("Player not found");
  await requireTeamAdmin(player.teamId);
  await deletePlayerRepo(playerId);
}

export async function updatePlayerAvatarAction(playerId: string, avatarURL: string) {
  const player = await getPlayerPublic(playerId);
  if (!player) throw new Error("Player not found");
  await requireTeamAdmin(player.teamId);
  // Defense in depth: never persist an avatar for a youth player even if
  // the client-side upload UI is somehow bypassed.
  if (player.isYouth) {
    throw new Error("Cannot set an avatar for a youth player");
  }
  await updatePlayerAvatarRepo(playerId, avatarURL);
}

const seasonSchema = z.object({
  name: z.string().min(2).max(20),
});

export async function createSeasonAction(
  teamId: string,
  input: z.infer<typeof seasonSchema>,
): Promise<{ seasonId: string }> {
  const uid = await requireTeamAdmin(teamId);
  const parsed = seasonSchema.parse(input);
  const seasonId = await createSeasonRepo(teamId, parsed, uid);
  return { seasonId };
}

export async function updateSeasonAction(
  seasonId: string,
  input: z.infer<typeof seasonSchema>,
) {
  const season = await getSeason(seasonId);
  if (!season) throw new Error("Season not found");
  await requireTeamAdmin(season.teamId);
  const parsed = seasonSchema.parse(input);
  await updateSeasonRepo(seasonId, parsed);
}

export async function deleteSeasonAction(seasonId: string) {
  const season = await getSeason(seasonId);
  if (!season) throw new Error("Season not found");
  await requireTeamAdmin(season.teamId);
  // Throws if the season still has actions.
  await deleteSeasonRepo(seasonId);
}

export async function setActiveSeasonAction(seasonId: string) {
  const season = await getSeason(seasonId);
  if (!season) throw new Error("Season not found");
  await requireTeamAdmin(season.teamId);
  await setActiveSeasonRepo(season.teamId, seasonId);
}

const actionTypeEnum = z.enum(["match", "training", "tournament", "cup", "other"]);

const actionResultSchema = z
  .object({ ourScore: z.number().int().min(0), theirScore: z.number().int().min(0) })
  .nullable();

const actionSchema = z.object({
  seasonId: z.string().min(1),
  type: actionTypeEnum,
  title: z.string().min(1),
  competition: z.string().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Use HH:MM")
    .nullable(),
  location: z.string().nullable(),
  isHome: z.boolean().nullable(),
  result: actionResultSchema,
  squadPlayerIds: z.array(z.string()),
  notes: z.string().nullable(),
});

/** Throws if `seasonId` doesn't belong to `teamId`, or a squad id isn't on that team's roster. */
async function assertValidActionInput(teamId: string, parsed: z.infer<typeof actionSchema>) {
  const season = await getSeason(parsed.seasonId);
  if (!season || season.teamId !== teamId) {
    throw new Error("Season not found for this team");
  }

  const roster = await listPlayersForTeam(teamId);
  const rosterIds = new Set(roster.map((player) => player.id));
  if (!parsed.squadPlayerIds.every((id) => rosterIds.has(id))) {
    throw new Error("Squad contains a player not on this team's roster");
  }
}

export async function createActionAction(
  teamId: string,
  input: z.infer<typeof actionSchema>,
): Promise<{ actionId: string }> {
  const uid = await requireTeamAdmin(teamId);
  const parsed = actionSchema.parse(input);
  await assertValidActionInput(teamId, parsed);
  const actionId = await createActionRepo(teamId, parsed.seasonId, parsed, uid);
  return { actionId };
}

export async function updateActionAction(
  actionId: string,
  input: z.infer<typeof actionSchema>,
) {
  const action = await getAction(actionId);
  if (!action) throw new Error("Action not found");
  await requireTeamAdmin(action.teamId);
  const parsed = actionSchema.parse(input);
  await assertValidActionInput(action.teamId, parsed);
  await updateActionRepo(actionId, parsed);
}

export async function deleteActionAction(actionId: string) {
  const action = await getAction(actionId);
  if (!action) throw new Error("Action not found");
  await requireTeamAdmin(action.teamId);
  await deleteActionRepo(actionId);
}
