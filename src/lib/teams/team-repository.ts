import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminFirestore } from "@/lib/firebase/admin";
import type { Team, TeamColors, TeamSocialLinks } from "@/lib/types/team";

const teamsCollection = adminFirestore.collection("teams");

export interface CreateTeamInput {
  name: string;
  category: string;
  club: string | null;
  location: string;
  homePitch: string;
  colors: TeamColors | null;
}

export async function createTeam(input: CreateTeamInput, creatorUid: string): Promise<string> {
  const ref = teamsCollection.doc();
  const newTeam: Omit<Team, "id" | "createdAt" | "updatedAt"> = {
    name: input.name,
    category: input.category,
    club: input.club,
    location: input.location,
    homePitch: input.homePitch,
    logoURL: null,
    colors: input.colors,
    socialLinks: {},
    adminUids: [creatorUid],
    createdBy: creatorUid,
  };
  await ref.set({
    ...newTeam,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const snapshot = await teamsCollection.doc(teamId).get();
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() } as Team;
}

export async function listTeamsForAdmin(uid: string): Promise<Team[]> {
  const snapshot = await teamsCollection.where("adminUids", "array-contains", uid).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Team);
}

export async function listAllTeams(): Promise<Team[]> {
  const snapshot = await teamsCollection.orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Team);
}

export async function listRecentTeams(limit: number): Promise<Team[]> {
  const snapshot = await teamsCollection.orderBy("createdAt", "desc").limit(limit).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Team);
}

// Drops ids for teams that no longer exist (e.g. a followed team was since
// deleted) rather than failing the whole lookup.
export async function getTeamsByIds(teamIds: string[]): Promise<Team[]> {
  const teams = await Promise.all(teamIds.map((id) => getTeam(id)));
  return teams.filter((team): team is Team => team !== null);
}

export async function isTeamAdmin(teamId: string, uid: string): Promise<boolean> {
  const team = await getTeam(teamId);
  return team !== null && team.adminUids.includes(uid);
}

export interface UpdateTeamInput {
  name?: string;
  category?: string;
  club?: string | null;
  location?: string;
  homePitch?: string;
  logoURL?: string | null;
  colors?: TeamColors | null;
  socialLinks?: TeamSocialLinks;
}

export async function updateTeam(teamId: string, input: UpdateTeamInput): Promise<void> {
  await teamsCollection.doc(teamId).set(
    { ...input, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}

export async function addTeamAdmin(teamId: string, uid: string): Promise<void> {
  await teamsCollection.doc(teamId).update({
    adminUids: FieldValue.arrayUnion(uid),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/** Throws if uid is the team's only remaining admin — a team can't end up admin-less. */
export async function removeTeamAdmin(teamId: string, uid: string): Promise<void> {
  const team = await getTeam(teamId);
  if (!team) throw new Error("Team not found");
  if (team.adminUids.length <= 1 && team.adminUids.includes(uid)) {
    throw new Error("Cannot remove the last remaining admin");
  }
  await teamsCollection.doc(teamId).update({
    adminUids: FieldValue.arrayRemove(uid),
    updatedAt: FieldValue.serverTimestamp(),
  });
}
