import { NextResponse } from "next/server";
import { z } from "zod";

import { adminAuth } from "@/lib/firebase/admin";
import {
  clearSessionCookie,
  createSessionCookie,
  setSessionCookie,
} from "@/lib/auth/session";
import { ensureUserProfile } from "@/lib/users/user-repository";

// firebase-admin isn't Edge-compatible; this route must run on Node.
export const runtime = "nodejs";

const requestSchema = z.object({
  idToken: z.string().min(1),
  locale: z.enum(["en", "cs"]).default("en"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { idToken, locale } = parsed.data;

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid ID token" }, { status: 401 });
  }

  await ensureUserProfile({
    uid: decodedToken.uid,
    email: decodedToken.email ?? null,
    displayName: decodedToken.name ?? decodedToken.email?.split("@")[0] ?? "New user",
    photoURL: decodedToken.picture ?? null,
    locale,
  });

  const sessionCookie = await createSessionCookie(idToken);
  await setSessionCookie(sessionCookie);

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
