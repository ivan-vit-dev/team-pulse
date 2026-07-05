import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "__session";

// Pathnames (with the locale prefix stripped) that require a session.
// This is a cheap, Edge-safe presence check only — the Admin SDK can't run
// here, so the authoritative verification happens in the (app) layout via
// getCurrentUser(). See CLAUDE.md for the full auth flow.
const PROTECTED_SEGMENTS = ["/settings"];

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  const { pathname } = request.nextUrl;
  const localeMatch = pathname.match(/^\/(en|cs)(?=\/|$)/);
  const pathnameWithoutLocale = localeMatch
    ? pathname.slice(localeMatch[0].length) || "/"
    : pathname;

  const isProtected = PROTECTED_SEGMENTS.some((segment) =>
    pathnameWithoutLocale.startsWith(segment),
  );

  if (isProtected && !request.cookies.has(SESSION_COOKIE_NAME)) {
    const locale = localeMatch?.[1] ?? routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
