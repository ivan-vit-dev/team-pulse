import "server-only";

import { getVerifiedUid } from "@/lib/auth/session";

/** Throws if the caller isn't signed in — use at the top of every Server Action. */
export async function requireUid(): Promise<string> {
  const uid = await getVerifiedUid();
  if (!uid) {
    throw new Error("Not authenticated");
  }
  return uid;
}
