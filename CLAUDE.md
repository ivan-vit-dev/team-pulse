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

**All 7 MVP phases are implemented** (see Phase Roadmap below): Foundation + Auth, Team
Management, Seasons & Actions, Timeline, Follow System, Comments/Media/Reactions, Notifications
(FCM push + an in-app inbox, both via the same Cloud Function), and the Moderation Console. The
one known gap: no email notification channel yet.

## Tech stack

- Next.js 16, App Router, TypeScript, Server Components for data fetching + Client Components
  for interactivity — see `AGENTS.md`/`node_modules/next/dist/docs/` before assuming an API from
  older Next.js versions still applies (e.g. `middleware.ts` was replaced by `proxy.ts`)
- Firebase: Authentication, Firestore, Storage, Cloud Functions (`functions/src/index.ts` —
  `onActionCreated` trigger fans out FCM push notifications to followers), Remote Config (not
  yet used)
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
    users/                 user-repository.ts (Firestore CRUD for users/{uid}; follow/unfollow,
                           FCM token registration all live here, not a separate module)
    teams/                 team-repository.ts, admin-invite-repository.ts
    players/               player-repository.ts (public/private split), youth.ts (age threshold)
    seasons/               season-repository.ts (CRUD, setActiveSeason)
    actions/               action-repository.ts (CRUD, paginated past/upcoming queries, likes)
    comments/              comment-repository.ts (create/list/delete/pin)
    media/                 media-repository.ts (create/list/delete)
    reports/               report-repository.ts, report-preview.ts
    notifications/         notification-repository.ts (paginated list, unread count, mark read)
    types/                 domain TypeScript types (user.ts, team.ts, player.ts, action.ts, ...)
    utils/                 cn.ts, firebase-errors.ts
  hooks/useAuth.ts          consumes AuthProvider's client-side auth state (UX only)
  components/
    ui/                    shadcn/Base UI primitives — do not hand-edit, re-run `shadcn add`
    auth/                  AuthProvider, LoginForm, RegisterForm, GoogleSignInButton
    layout/                Navbar, Footer, LocaleSwitcher, UserMenu
    notifications/         NotificationBell (Navbar dropdown), NotificationList, NotificationRow
    profile/                ProfileForm, AvatarUploader, NotificationPrefsForm, FollowedTeamsList
    teams/                 CreateTeamForm, EditTeamForm, TeamLogoUploader, AdminList,
                            InviteAdminForm, PendingInvitesList, InvitesList
    players/               PlayerForm, PlayerAvatarUploader, PlayerAdminList, RosterGrid,
                            YouthPrivacyBadge
    seasons/               SeasonForm, SeasonAdminList, SeasonSwitcher
    actions/               ActionForm, ActionAdminList, ActionTypeBadge
    timeline/               ActionCard, PastActionsFeed, UpcomingActionsList, SquadChips,
                            LikeButton
    comments/              CommentForm, CommentList
    media/                 ActionMediaUploader, ActionMediaGallery
    reports/               ReportButton, ReportsAdminList
    home/                  FollowedTeamsFeed, AdminTeamsPanel (personalized signed-in home)
  app/
    api/auth/session/route.ts   session cookie mint/clear (Node runtime)
    [locale]/
      layout.tsx           fonts, NextIntlClientProvider, AuthProvider, Navbar/Footer, root <html>
      page.tsx             landing page (signed-out) / personalized feed (signed-in)
      teams/[teamId]/      PUBLIC team page (roster + timeline) + actions.ts (comments, likes,
                           reports, load-more-past-actions) — no auth required to view
        actions/[actionId]/  action detail page (comments, media, full roster)
      (auth)/              login/register — redirects away if already signed in
      (app)/               protected — redirects to /login if not signed in
        settings/          profile settings page + actions.ts
        notifications/     in-app notification inbox page + actions.ts (get recent/load
                           more/mark read/mark all read)
        teams/             "my teams" (admin) list, actions.ts (createTeamAction)
          new/              create-team page
          [teamId]/admin/   admin dashboard + actions.ts (team/admin/player/season/action/media
                            mutations, report resolve/dismiss/remove)
            players/new, players/[playerId]/edit
            seasons/, seasons/[seasonId]/actions/new, .../actions/[actionId]/edit
        invites/           pending admin-invite accept/decline + actions.ts
functions/
  src/index.ts             onActionCreated Firestore trigger — fans out FCM push (respects
                            notificationPreferences.push, prunes invalid tokens) AND writes a
                            users/{uid}/notifications doc per follower (always-on, not
                            preference-gated) to every follower
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
- `seasons`, `actions`, `comments`, `media` — **implemented**. Real `isTeamAdmin`-gated
  `firestore.rules`, not placeholders.
- `reports/{reportId}` — **implemented**. Reportable content: comments, media, teams, players.
  Team-scoped, not a platform-wide moderator role — a team's own `adminUids` review and
  resolve/dismiss/remove reports filed against that team's own content. See
  `src/lib/reports/report-repository.ts`, `reportContentAction` in
  `src/app/[locale]/teams/[teamId]/actions.ts`, and
  `resolveReportAction`/`dismissReportAction`/`removeReportedContentAction` in
  `src/app/[locale]/(app)/teams/[teamId]/admin/actions.ts`.
- `users/{uid}/notifications/{notificationId}` — **implemented**. Persisted in-app inbox
  alongside FCM push (see `functions/src/index.ts`'s `onActionCreated`, which now writes one of
  these per follower in the same batch it sends push) — always-on, not gated by
  `notificationPreferences.push`. Read/mark-read only by the owning user; create/delete are
  Cloud-Function-only (`allow create, delete: if false`). See
  `src/lib/notifications/notification-repository.ts` and
  `src/app/[locale]/(app)/notifications/actions.ts`.

## Youth privacy (SRS §8 — implemented for Players; must inform all future work too)

Youth players (under `YOUTH_AGE_THRESHOLD` in `src/lib/players/youth.ts`, currently a constant
18) show a pseudonym only, no photo, and no personal info in any public-facing view; real
name/birthdate/unrestricted avatar are visible to team admins only. Implemented via the
public/private document split described above — see `YouthPrivacyBadge` in
`src/components/players/` (also documented in APP_DESIGN.md) for the UI convention to reuse.
Any future Comment/Media/Timeline work that surfaces a player must reuse `PlayerPublic`
(`src/lib/types/player.ts`), never re-derive a "safe" view ad hoc.

## Phase Roadmap (MVP priority order)

All 7 MVP phases below are **done**. This list is now a map of where each phase lives, not a
to-do list — see "Repo structure" above for exact file locations.

1. ~~**Team Management**~~ — teams, admin invites, players with youth privacy
2. ~~**Seasons & Actions**~~ — matches/trainings/tournaments content model, admin CRUD
3. ~~**Timeline**~~ — fan-facing season view aggregating actions, paginated past-actions feed
4. ~~**Follow System**~~ — real `followedTeamIds` (`followTeam`/`unfollowTeam` in
   `user-repository.ts`), personalized home feed (`FollowedTeamsFeed`)
5. ~~**Comments/Media/Reactions**~~ — engagement layer (comments, media gallery, likes),
   youth-privacy-aware (reuses `PlayerPublic`)
6. ~~**Notifications**~~ — `onActionCreated` Cloud Function fans out both FCM push and a
   persisted `users/{uid}/notifications` in-app inbox entry to followers (bell icon in `Navbar`,
   full history at `/notifications`). Push preference (`notificationPreferences.push`) only gates
   the FCM channel — the in-app inbox is always-on. **Email is still not implemented.**
7. ~~**Moderation Console**~~ — reports (comments/media/teams/players), resolved by a team's own
   admins via the existing `adminUids` mechanism — no platform-wide moderator role

### Next up (post-MVP)

- **Email notification channel** — second delivery channel alongside FCM push + the in-app inbox.

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
