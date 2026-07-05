@AGENTS.md

# CLAUDE.md

Guidance for Claude Code (and other contributors) working in this repository.

## Project summary

TeamPulse is a responsive web app connecting fans, parents, and supporters with amateur and
youth football teams. Team admins publish seasons, matches, trainings, and tournaments; fans
follow teams and browse a season timeline with comments, media, and reactions. Youth players get
privacy protections (pseudonym, no photo, no personal info in public views). Full requirements
are in the original SRS the client provided (not checked into this repo) — this file and
[APP_DESIGN.md](./APP_DESIGN.md) are the living reference going forward.

**Only Foundation + Auth and Team Management are implemented so far** (see Phase Roadmap below).
Don't assume season/action/timeline/follow/comment/notification/moderation features exist in
code yet.

## Tech stack

- Next.js 16, App Router, TypeScript, Server Components for data fetching + Client Components
  for interactivity — see `AGENTS.md`/`node_modules/next/dist/docs/` before assuming an API from
  older Next.js versions still applies (e.g. `middleware.ts` was replaced by `proxy.ts`)
- Firebase: Authentication, Firestore, Storage, Cloud Functions (not yet used), Remote Config
  (not yet used)
- Tailwind CSS + shadcn/ui — note shadcn here is built on **Base UI** (`@base-ui/react`), not
  Radix. Polymorphic composition uses the `render` prop, not `asChild`. See APP_DESIGN.md's
  Buttons section for the correct pattern.
- next-intl for i18n (`en` + `cs`), segment routing under `src/app/[locale]/...`
- react-hook-form + zod for all forms
- npm as the package manager

## Key architectural decisions

**Session-cookie auth, not client-only.** Server Components can't see Firebase client SDK auth
state (it lives in browser storage). Flow: client signs in with the Firebase client SDK → gets an
ID token → POSTs it to `src/app/api/auth/session/route.ts` (`runtime = 'nodejs'`, since
`firebase-admin` isn't Edge-compatible) → the handler verifies the token, ensures the Firestore
user profile exists, and mints an `httpOnly` session cookie via `firebase-admin/auth`.
`src/proxy.ts` (Next.js 16's replacement for `middleware.ts`) does a cheap cookie-*presence*
check to redirect early; the authoritative check is `getCurrentUser()` in
`src/lib/auth/session.ts`, called from the `(app)` layout.

**Profile creation happens inline in the session Route Handler**, not a Cloud Functions
`onCreate` trigger — avoids a second deploy target and the eventually-consistent race where the
client redirects to `/settings` before a background trigger has written the doc.
`ensureUserProfile()` in `src/lib/users/user-repository.ts` is idempotent (`set(..., {merge:
true})`), so it safely handles both first-time registration and first-time Google sign-in.

**Firebase Local Emulator Suite** is the default local dev target — `.env.local.example` ships
with `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` and demo project values that work without any
real Firebase project. `src/lib/firebase/client.ts` and `src/lib/firebase/admin.ts` both branch
on emulator env vars.

**i18n via next-intl**, `src/app/[locale]/...` segment routing. `src/proxy.ts` composes
next-intl's locale middleware with the auth-cookie check in one exported function (Next.js only
allows one middleware/proxy export).

**All Team/Player/Invite mutations go through Server Actions using the Admin SDK**, the same
pattern as Foundation + Auth — client code never writes to Firestore directly for these
collections (the only direct client Firestore/Storage use anywhere in the app is Storage
uploads for avatars/logos/photos). `firestore.rules`/`storage.rules` still encode the intended
access model for defense-in-depth (and so a future real-time-listener feature isn't wide open),
but authorization is enforced in TypeScript first. See `requireTeamAdmin()` in
`src/app/[locale]/(app)/teams/[teamId]/admin/actions.ts`.

**Youth privacy is a document-boundary, not a field-boundary.** Firestore has no field-level read
security — if a document is readable, every field on it is readable. So each player is split into
`players/{playerId}` (public: displayName/pseudonym, jerseyNumber, isYouth, avatarURL — always
world-readable) and `players/{playerId}/private/profile` (realName, birthdate — admin-of-team
only). `isYouth` is computed server-side from `birthdate` in `src/lib/players/youth.ts`
(`YOUTH_AGE_THRESHOLD = 18`, a placeholder for future Remote Config) and re-checked on every
write in `src/lib/players/player-repository.ts`, which forces `avatarURL` to `null` whenever
`isYouth` is true — regardless of what the client sends.

**Admin invite accept/decline is a Server Action, not a direct client Firestore write** — it
needs to atomically flip the invite's status *and* add the accepting user's uid to the team's
`adminUids`, and the invited user isn't a team admin yet (so they couldn't pass `isTeamAdmin()`
rules-side anyway). `src/lib/teams/admin-invite-repository.ts` re-verifies the invite's
`invitedEmail` matches the caller's own verified email before doing either write.

## Repo structure

```
src/
  proxy.ts                 next-intl locale routing + auth-cookie presence check
  i18n/                    next-intl routing config, request config, locale-aware navigation
  messages/                en.json, cs.json message catalogs
  lib/
    firebase/              client.ts (browser SDK), admin.ts (server-only Admin SDK)
    auth/                  session.ts, require-uid.ts, client-actions.ts
    users/                 user-repository.ts (Firestore CRUD for users/{uid})
    teams/                 team-repository.ts, admin-invite-repository.ts
    players/               player-repository.ts (public/private split), youth.ts (age threshold)
    types/                 domain TypeScript types (user.ts, team.ts, player.ts)
    utils/                 cn.ts, firebase-errors.ts
  hooks/useAuth.ts          consumes AuthProvider's client-side auth state (UX only)
  components/
    ui/                    shadcn/Base UI primitives — do not hand-edit, re-run `shadcn add`
    auth/                  AuthProvider, LoginForm, RegisterForm, GoogleSignInButton
    layout/                Navbar, Footer, LocaleSwitcher, UserMenu
    profile/                ProfileForm, AvatarUploader, NotificationPrefsForm, FollowedTeamsList
    teams/                 CreateTeamForm, EditTeamForm, TeamLogoUploader, AdminList,
                            InviteAdminForm, PendingInvitesList, InvitesList
    players/               PlayerForm, PlayerAvatarUploader, PlayerAdminList, RosterGrid,
                            YouthPrivacyBadge
  app/
    api/auth/session/route.ts   session cookie mint/clear (Node runtime)
    [locale]/
      layout.tsx           fonts, NextIntlClientProvider, AuthProvider, Navbar/Footer, root <html>
      page.tsx             landing page
      teams/[teamId]/      PUBLIC team page (info + roster) — no auth required
      (auth)/              login/register — redirects away if already signed in
      (app)/               protected — redirects to /login if not signed in
        settings/          profile settings page + actions.ts
        teams/             "my teams" (admin) list, actions.ts (createTeamAction)
          new/              create-team page
          [teamId]/admin/   admin dashboard + actions.ts (team/admin/player mutations)
            players/new, players/[playerId]/edit
        invites/           pending admin-invite accept/decline + actions.ts
```

Note the two different `teams/[teamId]` routes at different levels: the **public** team page
lives directly under `[locale]/teams/[teamId]/` (outside `(app)`, so logged-out fans can view a
team), while the **admin** dashboard lives under `[locale]/(app)/teams/[teamId]/admin/` (inside
the protected group). Route groups don't add URL segments, so both contribute to the same
`/teams/...` URL space without colliding — this is intentional, not an accident.

## Firestore collections

- `users/{uid}` — **implemented**. See `src/lib/types/user.ts`.
- `teams/{teamId}` — **implemented**. `adminUids: string[]` gates all writes; see
  `src/lib/types/team.ts`.
- `teamAdminInvites/{inviteId}` — **implemented**. Pending/accepted/declined invites, matched to
  a user by email (not uid) since the invited person may not have an account yet.
- `players/{playerId}` (public fields) + `players/{playerId}/private/profile` (admin-only real
  name/birthdate) — **implemented**. See "Youth privacy" below — this split is load-bearing, not
  a style choice.
- `seasons`, `actions`, `comments`, `media`, `reports` — **reserved**. `firestore.rules` has
  permissive placeholder rules for each with a `// TODO Phase "...":` comment naming the real
  access-control rule that phase will add. Don't tighten these ad hoc without also implementing
  the corresponding feature — check the roadmap below first.

## Youth privacy (SRS §8 — implemented for Players; must inform all future work too)

Youth players (under `YOUTH_AGE_THRESHOLD` in `src/lib/players/youth.ts`, currently a constant
18) show a pseudonym only, no photo, and no personal info in any public-facing view; real
name/birthdate/unrestricted avatar are visible to team admins only. Implemented via the
public/private document split described above — see `YouthPrivacyBadge` in
`src/components/players/` (also documented in APP_DESIGN.md) for the UI convention to reuse.
Any future Comment/Media/Timeline work that surfaces a player must reuse `PlayerPublic`
(`src/lib/types/player.ts`), never re-derive a "safe" view ad hoc.

## Phase Roadmap (MVP priority order)

1. ~~**Team Management**~~ — done: teams, admin invites, players with youth privacy
2. **Seasons & Actions** — matches/trainings/tournaments content model (next up)
3. **Timeline** — fan-facing season view aggregating actions (the app's signature surface)
4. **Follow System** — real `followedTeamIds`, personalized timeline (currently always `[]`)
5. **Comments/Media/Reactions** — engagement layer, needs youth-privacy-aware moderation hooks
6. **Notifications** — likely where Cloud Functions actually get introduced (fan-out)
7. **Moderation Console** — reports/content removal, builds on the `role` field on `UserProfile`

## Dev commands

```bash
npm install
cp .env.local.example .env.local   # first time only
firebase emulators:start           # terminal 1
npm run dev                        # terminal 2
```

See [README.md](./README.md) for connecting a real Firebase project and other details.

## Design system

See [APP_DESIGN.md](./APP_DESIGN.md) for colors, typography, component patterns, and the
team-brand theming convention. Update it whenever a new reusable UI pattern is introduced.
