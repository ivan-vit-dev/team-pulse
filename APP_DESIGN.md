# team-pulse — Design System

Design reference for TeamPulse. Covers colors, typography, component patterns, layout, and
timeline conventions. Update this when adding new reusable UI patterns.

---

## Color System

**"Matchday, under lights"** — a deeper, more saturated pitch green (hue 152) paired with a
richer kit navy (hue 250) and a new warm sodium-floodlight gold accent (hue 75). The floodlight
tone is dusk-kickoff energy, not a generic amber/warning color — it's reserved for glow effects,
the timeline's "next" ring, and hero eyebrows. Distinct from any violet palette used in other
projects — don't reuse those hues here.

All colors use `oklch()` values. **Do not use opacity modifiers** (`bg-primary/50`) — they break
with CSS variable-based tokens. Use `color-mix()` instead:

```css
/* correct */
background: color-mix(in oklch, var(--primary) 15%, transparent);

/* breaks */
@apply bg-primary/50;
```

### Light mode tokens (`:root`)

```css
--background:           oklch(0.975 0.006 95);  /* warm chalk white */
--foreground:           oklch(0.16 0.02 250);    /* near-black, navy-tinted */
--card:                 oklch(1 0 0);
--card-foreground:      oklch(0.16 0.02 250);
--popover:              oklch(1 0 0);
--popover-foreground:   oklch(0.16 0.02 250);
--primary:              oklch(0.56 0.17 152);    /* deep turf green */
--primary-foreground:   oklch(0.99 0.005 152);
--secondary:            oklch(0.93 0.015 152);
--secondary-foreground: oklch(0.28 0.05 152);
--muted:                oklch(0.93 0.006 250);
--muted-foreground:     oklch(0.48 0.02 250);
--accent:               oklch(0.91 0.02 250);
--accent-foreground:    oklch(0.22 0.06 250);
--brand-accent:         oklch(0.42 0.15 250);    /* deep kit navy blue */
--floodlight:           oklch(0.74 0.15 75);     /* sodium floodlight gold */
--floodlight-foreground: oklch(0.24 0.05 75);
--destructive:          oklch(0.577 0.245 27);
--border:               oklch(0.89 0.008 250);
--input:                oklch(0.89 0.008 250);
--ring:                 oklch(0.56 0.17 152);
--radius:               0.75rem;
--shadow-glow:          0 0 24px oklch(0.56 0.17 152 / 0.30);
--shadow-glow-navy:     0 0 24px oklch(0.42 0.15 250 / 0.30);
--shadow-glow-floodlight: 0 0 28px oklch(0.74 0.15 75 / 0.35);
```

### Dark mode tokens (`.dark`)

```css
--background:           oklch(0.10 0.018 152);  /* near-black, green-tinted "ink" */
--foreground:           oklch(0.95 0.004 152);
--card:                 oklch(0.16 0.02 152);
--primary:              oklch(0.72 0.19 152);    /* brighter turf in dark */
--secondary:            oklch(0.24 0.02 152);
--muted:                oklch(0.22 0.014 250);
--muted-foreground:     oklch(0.64 0.016 250);
--accent:               oklch(0.24 0.03 250);
--brand-accent:         oklch(0.60 0.18 250);
--floodlight:           oklch(0.78 0.16 78);
--floodlight-foreground: oklch(0.16 0.03 78);
--border:               oklch(1 0 0 / 9%);
--input:                oklch(1 0 0 / 12%);
--shadow-glow:          0 0 28px oklch(0.72 0.19 152 / 0.35);
--shadow-glow-navy:     0 0 28px oklch(0.60 0.18 250 / 0.35);
--shadow-glow-floodlight: 0 0 32px oklch(0.78 0.16 78 / 0.40);
```

### Sidebar tokens

```css
/* light */
--sidebar:              oklch(0.96 0.008 250);
/* dark */
--sidebar:              oklch(0.14 0.014 250);
/* shared */
--sidebar-primary:      (same as --primary)
--sidebar-border:       (same as --border)
```

### Team-brand override tokens

Teams carry their own brand colors (SRS FR-10/FR-12: `colors` field). The **app shell** (nav,
global buttons, marketing pages) always uses the tokens above — never a team's colors. Only
**team-scoped surfaces** (Team Home timeline, Action cards, the team's own admin dashboard)
apply a team override, scoped to a wrapper element so it never leaks into global chrome:

```tsx
// app/[locale]/(app)/teams/[teamId]/layout.tsx
<div
  style={{
    "--team-primary": team.colors.primary,
    "--team-secondary": team.colors.secondary,
  } as React.CSSProperties}
  className="team-scope"
>
  {children}
</div>
```

```css
.team-scope {
  --primary: var(--team-primary, var(--primary));
}
```

Never hardcode a team's hex value outside this scope. Fall back to the app `--primary` (pitch
green) if a team hasn't set custom colors yet.

### Action-type tokens

Analogous to a rarity system, but for action types (SRS FR-22). Each has a base color and a
foreground (`-fg`) for text/icons on that background. Used for action-type chips and timeline
markers — always in addition to, never instead of, the team-brand color.

| Action type | CSS token | Light value | Dark value |
|---|---|---|---|
| match | `--action-match` | `oklch(0.60 0.19 25)` | `oklch(0.66 0.20 25)` |
| training | `--action-training` | `oklch(0.58 0.14 230)` | `oklch(0.65 0.15 230)` |
| tournament | `--action-tournament` | `oklch(0.70 0.14 85)` | `oklch(0.76 0.15 85)` |
| cup | `--action-cup` | `oklch(0.55 0.20 300)` | `oklch(0.62 0.21 300)` |
| other | `--action-other` | `oklch(0.65 0.01 250)` | `oklch(0.68 0.01 250)` |

```tsx
<ActionTypeBadge type="match" />          // uses --action-match
<span style={{ color: "var(--action-tournament)" }} />
```

### Timeline state tokens

Core to FR-40 (past actions colored, upcoming grayed, next action highlighted):

```css
--timeline-past-opacity:     1;                                   /* full team-brand color */
--timeline-upcoming-filter:  grayscale(0.7) opacity(0.55);        /* muted, not yet happened */
--timeline-next-ring:        0 0 0 3px var(--team-primary, var(--primary));
```

---

## Typography

Three Google Fonts loaded via `next/font/google` in the root `[locale]` layout:

| Font | CSS variable | Tailwind class | Use |
|---|---|---|---|
| **Figtree** | `--font-sans` | `font-sans` (default body) | All UI text, body, forms, labels, comments |
| **Barlow Condensed (Bold)** | `--font-display` | `font-display font-bold` | Card titles, section heads, dates, nav |
| **Anton** | `--font-impact` | `font-impact` | Used sparingly: hero headlines, scorelines, big stat numbers only — never body text |

```html
<!-- Action title on a timeline card -->
<p class="font-display font-bold text-2xl uppercase tracking-wide">FC Sokol vs. Slavia B</p>

<!-- Scoreline — the one place Anton shows up on a card -->
<span class="font-impact text-lg">2&nbsp;:&nbsp;1</span>

<!-- Body / label text -->
<p class="font-sans text-sm text-muted-foreground">Match · League · 12 Oct 2026</p>
```

---

## Gradient & Utility Classes

Defined in `src/app/globals.css` `@layer utilities`. All have `.dark` variants.

| Class | What it does | Typical use |
|---|---|---|
| `.gradient-brand` | `135deg` turf → kit navy | Primary CTAs |
| `.gradient-text` | Same gradient clipped to text | App name, accent headings |
| `.gradient-hero` | Two-blob floodlight + turf radial mesh wash | Landing hero, team page header |
| `.bg-pitch-lines` | Faint halfway-line + center-circle watermark | Hero/team-header backdrops — texture, not a graphic |
| `.bg-grain` | Subtle film-grain overlay (apply to a `relative` ancestor) | Paired with `.gradient-hero` for a dusk-kickoff feel |
| `.glass` | `backdrop-blur(16px)` + semi-transparent bg + border | Floating headers, sticky timeline "next action" bar |
| `.shadow-glow` | `var(--shadow-glow)` | Highlighted elements, active/selected states |
| `.shadow-glow-navy` | `var(--shadow-glow-navy)` | Admin-only actions, secondary emphasis |
| `.shadow-glow-floodlight` | `var(--shadow-glow-floodlight)` | Next-match card, floodlight-themed highlights |
| `.ticket-seam` + `.ticket-notch` | Dashed seam + punched circle notches | Past-result timeline cards — a torn ticket-stub motif |

### Ambient page background

`<AmbientBackground />` (`src/components/layout/AmbientBackground.tsx`) is mounted once in the
root `[locale]` layout, fixed behind everything: paints `--background` and four soft blurred
turf/floodlight/navy blobs. `body` itself no longer paints a background color — that's this
component's job — so any page section without its own opaque background (Card, `.glass`, etc.
still set their own) lets the ambient shapes show through.

Gradient text:
```html
<span class="gradient-text font-display font-bold text-2xl">TeamPulse</span>
```

---

## Animation Utilities

Keyframes defined in `globals.css @theme inline`. Respect `prefers-reduced-motion` — all of the
below must degrade to an instant/no-op state when reduced motion is requested.

| Class | Effect | Duration | Use |
|---|---|---|---|
| `.animate-timeline-in` | `translateY(8px) → 0, opacity 0 → 1` | 0.3s | New timeline card entering on scroll |
| `.animate-pulse-next` | Soft glow pulse using `--timeline-next-ring` | 2s loop | "Next action" card at top of timeline |
| `.animate-shimmer` | Background-position sweep | 2s loop | Loading skeletons |

---

## Buttons

Use `<Button>` from `src/components/ui/button` (shadcn, built on **Base UI** — `@base-ui/react`,
not Radix). To compose a `Button`/`DropdownMenuItem`/`AlertDialogTrigger` with another element
(typically a `Link`), use the `render` prop — **not** `asChild`. The `render` element's own
children are what get displayed, so put the label on the render element itself, not on the
outer primitive:

```tsx
// correct — children live on the Link inside render
<Button render={<Link href="/teams/new">Create your team</Link>} />

// wrong — Button's children are discarded when render is set
<Button render={<Link href="/teams/new" />}>Create your team</Button>
```

```tsx
<Button>Follow team</Button>                        // pitch-green fill
<Button variant="outline">Unfollow</Button>          // bordered
<Button variant="ghost">Cancel</Button>              // text-only
<Button variant="destructive">Remove admin</Button>  // red
<Button size="sm">Small</Button>
<Button size="icon" className="h-9 w-9" aria-label="Pin comment">
  <Pin className="h-4 w-4" />
</Button>
```

Gradient CTA pattern (landing page, follow prompts):
```tsx
<Button className="gradient-brand text-primary-foreground border-none hover:opacity-90">
  Create your team
</Button>
```

Disabled + loading:
```tsx
<Button disabled={isSaving}>
  {isSaving ? "Saving…" : "Save changes"}
</Button>
```

---

## Input Fields

Always use `<Label>` + `<Input>` pairs. Field errors inline below — never in a toast.

```tsx
<div className="space-y-1.5">
  <Label htmlFor="displayName">Display name</Label>
  <Input id="displayName" placeholder="Jan Novák" {...register("displayName")} />
  {errors.displayName && (
    <p className="text-xs text-destructive">{errors.displayName.message}</p>
  )}
</div>
```

Always define a zod schema first, derive the type from it:
```ts
const schema = z.object({ displayName: z.string().min(2, "Required") });
type FormValues = z.infer<typeof schema>;
```

---

## Cards (UI containers)

shadcn `<Card>` for content panels and data blocks:

```tsx
<Card>
  <CardHeader>
    <h3 className="font-display font-bold text-lg">Upcoming actions</h3>
  </CardHeader>
  <CardContent className="space-y-3">...</CardContent>
</Card>
```

Clickable card:
```tsx
<Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={...}>
```

---

## Badges

**shadcn Badge** — general status/label:
```tsx
<Badge>New</Badge>
<Badge variant="outline">Draft</Badge>
```

**ActionTypeBadge** — action-type-colored pill, action type only:
```tsx
import { ActionTypeBadge } from "@/components/actions/ActionTypeBadge";

<ActionTypeBadge type="tournament" />
<ActionTypeBadge type="training" className="text-[10px] px-1.5 py-0" />
```

**YouthPrivacyBadge** — required wherever a youth player's identity could otherwise leak
(SRS §8). Renders a small lock/shield icon + tooltip, never the real name:
```tsx
import { YouthPrivacyBadge } from "@/components/players/YouthPrivacyBadge";

<div className="flex items-center gap-1.5">
  <span>{player.displayName}</span>
  <YouthPrivacyBadge />  {/* aria-label="Privacy protected player" */}
</div>
```

Both use `color-mix()` so they work in both light and dark mode.

---

## Dialogs & Alerts

Non-destructive: `<Dialog>`. Destructive confirmations: `<AlertDialog>`.

```tsx
<AlertDialog>
  <AlertDialogTrigger render={
    <Button variant="ghost" size="icon" aria-label="Remove player">
      <Trash2 className="h-4 w-4" />
    </Button>
  } />
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Remove this player?</AlertDialogTitle>
      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleRemove}>Remove</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Navigation & Layout

### AppShell (`(app)` layout)

`src/app/[locale]/(app)/layout.tsx` — wraps all protected pages. Calls `getCurrentUser()`
server-side, redirects to `/login?redirect=...` if unauthenticated. No client-side auth flash.

### Navbar

`src/components/layout/Navbar.tsx` — server component. Logged out: logo + Login/Register CTAs.
Logged in: logo, "My Teams" link, locale switcher, theme toggle, avatar dropdown
(`<DropdownMenu>`: Settings, Log out).

### AdminSidebar (future: Team Management phase)

Desktop left sidebar shown only within a team's admin dashboard. Active item uses
`--sidebar-primary`. Reserved nav items: Overview, Seasons, Actions, Players, Admins, Moderation.

### BottomNav (mobile, fan-facing)

Mobile bottom navigation, `fixed bottom-0`, safe-area padding. Reserved items: My Teams, Explore,
Notifications, Profile.

### PublicHeader

Landing page header — `.glass`, gradient logo, auth CTAs for signed-out visitors.

---

## Page Layout Patterns

### Standard protected page

```tsx
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Settings</h1>
      </div>
      <ProfileForm profile={profile} />
    </div>
  );
}
```

### Team Home (timeline) page — future phase, reserve the layout now

```
Desktop:
┌─────────────────────────────────────────────────────┐
│ [Team logo] FC Sokol           [Season: 2025/26 ▾]   │  ← .glass sticky header, team-scoped
├───────────────────────────────────────────────────────┤
│  ┌─ NEXT ─────────────────────────────────────────┐  │  ← .animate-pulse-next, timeline-next-ring
│  │  Sat 12 Oct · 14:00 · Match vs. Slavia B        │  │
│  └──────────────────────────────────────────────────┘  │
│  ● Past action (team-brand color, full opacity)        │
│  ● Past action                                          │
│  ○ Upcoming action (grayscale filter, muted)            │
│  ○ Upcoming action                                       │
│         ⋮  infinite scroll (FR-42)                      │
└─────────────────────────────────────────────────────┘
```

The vertical timeline is the app's signature surface (FR-40/41/42) — always team-scoped (see
Team-brand override tokens above), always respects the past/upcoming/next visual states, and
must degrade to a static (non-animated) "next" card under `prefers-reduced-motion`.

---

## Loading States

Use `<Skeleton>` for all loading placeholders. Match shape and size of actual content:

```tsx
// Timeline skeleton
<div className="space-y-4">
  {Array.from({ length: 4 }).map((_, i) => (
    <Skeleton key={i} className="h-24 w-full rounded-xl" />
  ))}
</div>

// Profile avatar skeleton
<Skeleton className="h-16 w-16 rounded-full" />
```

---

## Toasts

`sonner` (shadcn's `<Toaster>`) — one instance in the root `[locale]` layout. Call anywhere
without prop drilling:

```ts
import { toast } from "sonner";

toast.success("Profile updated.");
toast.error("Something went wrong.");
```

Never show raw Firebase error codes. Always map through a helper:
```ts
import { getFirebaseErrorMessage } from "@/lib/utils/firebase-errors";
toast.error(getFirebaseErrorMessage(error.code));
```

---

## i18n Conventions

- All user-facing strings via `useTranslations('namespace')` — never hardcode English or Czech
  strings in components.
- Locale always in the URL: `/en/...`, `/cs/...`.
- Message files: `src/messages/en.json` and `src/messages/cs.json`.
- Middleware: `src/proxy.ts` — composes next-intl's locale middleware with the auth-cookie
  presence check (single exported middleware function).

```tsx
"use client";
import { useTranslations } from "next-intl";

export function ProfileForm() {
  const t = useTranslations("profile");
  return <h1>{t("title")}</h1>;    // → "Nastavení profilu" / "Profile settings"
}
```

Active namespaces (this phase): `common`, `nav`, `auth`, `profile`. Reserved for later phases:
`teams`, `seasons`, `actions`, `timeline`, `comments`, `notifications`, `moderation`.

---

## Accessibility

- All interactive elements keyboard-reachable; visible focus ring uses `--ring`.
- Icon-only buttons: `aria-label` required.
  ```tsx
  <Button size="icon" aria-label="Pin comment"><Pin /></Button>
  ```
- Form fields: always paired with `<Label>` — no placeholder-only inputs.
- Decorative icons/emoji: `aria-hidden="true"`.
- Color contrast: primary pitch green (`oklch(0.62 0.15 152)`) on white and on dark backgrounds
  meets WCAG AA; verify any team-brand override color independently since it's user-supplied
  (SRS NFR-6) — fall back to app default if a team's color fails a contrast check against text.
- Youth privacy is an accessibility *and* safety concern: `YouthPrivacyBadge` must have a
  meaningful `aria-label`, not just a decorative icon, since it communicates a real safeguard.

---

## File Locations

| What | Where |
|---|---|
| CSS tokens, gradient utilities, keyframes | `src/app/globals.css` |
| Firebase client SDK (browser) | `src/lib/firebase/client.ts` |
| Firebase Admin SDK (server-only) | `src/lib/firebase/admin.ts` |
| Session cookie auth helpers | `src/lib/auth/session.ts` |
| Client-side auth actions | `src/lib/auth/client-actions.ts` |
| User profile Firestore CRUD | `src/lib/users/user-repository.ts` |
| Domain TypeScript types | `src/lib/types/` |
| shadcn/ui primitives | `src/components/ui/` |
| App layout components (Navbar, Footer, LocaleSwitcher) | `src/components/layout/` |
| Auth components (forms, provider) | `src/components/auth/` |
| Profile components | `src/components/profile/` |
| Team CRUD/admin/logo/invite components | `src/components/teams/` |
| Player form/roster/avatar/youth-privacy-badge components | `src/components/players/` |
| Team/player/invite Firestore CRUD | `src/lib/teams/`, `src/lib/players/` |
| Action-type badge (reserved for Seasons & Actions phase) | `src/components/actions/` |
| next-intl + auth-cookie middleware | `src/proxy.ts` |
| Locale/message config | `src/i18n/config.ts`, `src/i18n/request.ts`, `src/messages/` |
| Firestore security rules | `firestore.rules` |
