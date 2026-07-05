# TeamPulse

TeamPulse connects fans, parents, and supporters with amateur and youth football teams — admins
publish seasons, matches, and trainings; fans follow teams and browse a season timeline with
comments, media, and privacy protections for youth players.

This repo currently implements the **Foundation + Auth** slice (registration, login, profile
settings). See [CLAUDE.md](./CLAUDE.md) for architecture notes and the phase roadmap, and
[APP_DESIGN.md](./APP_DESIGN.md) for the design system.

## Prerequisites

- Node.js 20+ and npm
- [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`) for the
  Local Emulator Suite

## Setup

```bash
npm install
cp .env.local.example .env.local
```

The default `.env.local` values work out of the box against the **Firebase Local Emulator
Suite** — no real Firebase project is required for local development.

## Running locally

Start the emulators and the dev server in two terminals:

```bash
firebase emulators:start
```

```bash
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/en` (or `/cs`). The Emulator UI is at
http://localhost:4000.

## Connecting a real Firebase project

1. `firebase login`
2. `firebase use --add` (or edit `.firebaserc` directly — it's gitignored, copy it from
   `.firebaserc.example` first if it doesn't exist)
3. In `.env.local`, replace the `NEXT_PUBLIC_FIREBASE_*` values with your project's web app
   config (Firebase Console → Project settings → Your apps), set
   `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false`, and provide Admin SDK credentials via either
   `FIREBASE_SERVICE_ACCOUNT_KEY` (full service account JSON, single line) or the three
   `FIREBASE_ADMIN_*` fields.
4. Deploy security rules: `firebase deploy --only firestore:rules,storage`

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run a production build
- `npm run lint` — ESLint

## Project status

Only the Foundation + Auth phase is implemented. See the **Phase Roadmap** in
[CLAUDE.md](./CLAUDE.md) for what's next (Team Management, Seasons & Actions, Timeline, Follow
System, Comments/Media, Notifications, Moderation) — don't assume those features exist yet.


Test User:
test1@example.com
12345678