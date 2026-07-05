"use server";

import { z } from "zod";

import { getVerifiedUid } from "@/lib/auth/session";
import { updateUserProfile } from "@/lib/users/user-repository";

async function requireUid(): Promise<string> {
  const uid = await getVerifiedUid();
  if (!uid) {
    throw new Error("Not authenticated");
  }
  return uid;
}

const profileSchema = z.object({
  displayName: z.string().min(2),
  locale: z.enum(["en", "cs"]),
});

export async function updateProfileAction(input: z.infer<typeof profileSchema>) {
  const uid = await requireUid();
  const parsed = profileSchema.parse(input);
  await updateUserProfile(uid, parsed);
}

const notificationPrefsSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
});

export async function updateNotificationPrefsAction(
  input: z.infer<typeof notificationPrefsSchema>,
) {
  const uid = await requireUid();
  const parsed = notificationPrefsSchema.parse(input);
  await updateUserProfile(uid, { notificationPreferences: parsed });
}

export async function updateAvatarAction(photoURL: string) {
  const uid = await requireUid();
  await updateUserProfile(uid, { photoURL });
}
