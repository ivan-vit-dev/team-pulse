"use server";

import { z } from "zod";

import { requireUid } from "@/lib/auth/require-uid";
import { addFcmToken, removeFcmToken, updateUserProfile } from "@/lib/users/user-repository";

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
  categories: z.object({
    newAction: z.boolean(),
    actionUpdated: z.boolean(),
    adminInvite: z.boolean(),
    commentReply: z.boolean(),
    followInvite: z.boolean(),
  }),
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

export async function registerFcmTokenAction(token: string) {
  const uid = await requireUid();
  await addFcmToken(uid, token);
}

export async function unregisterFcmTokenAction(token: string) {
  const uid = await requireUid();
  await removeFcmToken(uid, token);
}
