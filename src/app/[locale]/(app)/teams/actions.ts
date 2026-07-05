"use server";

import { z } from "zod";

import { requireUid } from "@/lib/auth/require-uid";
import { createTeam } from "@/lib/teams/team-repository";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #1a2b3c");

const createTeamSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(1),
  club: z.string().nullable(),
  location: z.string().min(1),
  homePitch: z.string().min(1),
  colors: z
    .object({ primary: hexColor, secondary: hexColor })
    .nullable(),
});

export async function createTeamAction(
  input: z.infer<typeof createTeamSchema>,
): Promise<{ teamId: string }> {
  const uid = await requireUid();
  const parsed = createTeamSchema.parse(input);
  const teamId = await createTeam(parsed, uid);
  return { teamId };
}
