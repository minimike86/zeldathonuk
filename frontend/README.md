# ZeldathonUK — Frontend

React 19 + Vite 7 + TypeScript app that serves three audiences from one bundle:

1. the **public marathon site**,
2. the operator **control panel** (`/control/*`),
3. the **OBS overlays** (`/obs/*`) used as browser sources in the stream.

It talks to the [Django API](../backend/README.md) over REST (+ SSE for
low-latency overlay pushes), and authenticates with Clerk.

## Stack

- **React 19**, **Vite 7**, **TypeScript**, **React Router 7**.
- **Bootstrap 5** + a themeable `control.css` (CSS custom properties) for the
  control panel; bespoke CSS for the overlays.
- **Clerk** (`@clerk/clerk-react`) for sign-in; an `ApiTokenBridge` feeds the
  Clerk token to the API client.
- **`@dnd-kit`** for the drag-and-drop checklist/objective/layout editors.
- **FontAwesome** + **lucide-react** icons.

## Project layout

```
src/
├── routes/
│   ├── Home / Schedule / Charity / Incentives / Donations / History …  public pages
│   ├── control/         operator control panel (one file per section)
│   └── obs/             OBS overlays (omnibar, layouts, chest announcer, TTS, BRB, scenes)
├── lib/                 obsApi (typed API client + usePolledQuery), env, profanity, useTTS, buses
├── components/          shared UI (WaveText, ImageDropzone, donation platform chips, …)
└── router.tsx           route table (public, /control, /obs)
```

`lib/obsApi.ts` is the heart of the data layer: a typed client plus
`usePolledQuery(fn, intervalMs, deps, { cacheKey })` — a tiny polling hook with
optimistic `loading` state and optional localStorage seeding. Cross-tab "data
changed" buses (`eventBus`, `themeBus`, `itemsBus`, …) let one tab's edit refresh
the overlays/other tabs in ~one frame instead of waiting for the next poll.

## Public site

`/` homepage, `/schedule` (live run schedule + up-next), `/incentives`
(incentives + raffles), `/donations` (totals + donor wall), `/donate`, `/charity`
(charity info), `/history`, plus `/privacy` and `/terms`. `/tracking/:game` is a
standalone game-tracking view. The API origin is resolved per-host by
`lib/env.ts` so the public site (a separate origin) hits `api.<domain>` while
local dev stays on `localhost`.

## Control panel (`/control/*`, operator-only)

The operator cockpit. Each section is its own route/file under
`routes/control/`:

- **Overview** — at-a-glance dashboard.
- **Schedule** — order the run, set the currently-playing entry.
- **Timer** — run timer with splits (also drivable from a Stream Deck via the
  server hotkey endpoint).
- **Items** — per-game collectible checklist with drag-and-drop grouping, sets
  (upgrade chains / trade sequences), countable tallies, and a **Game picker**
  so any game's library can be edited, not just the live one.
- **Objectives** — per-game run-milestone library (timer splits + the omnibar
  checklist); "item get" objectives inherit their linked item's sprite.
- **Donations** — live donations list with moderation (mute reasons), totals,
  TTS now-reading highlight, manual add, and the Twitch source-channel tag.
- **Events / Games / Runners / Charities / Raffles** — catalogue management,
  including per-event donation pages and Twitch channels.
- **Twitch** — a tabbed hub: chat (announcements + recurring + broadcast/emote
  composer), predictions, shoutouts, channel-point rewards → action mappings.
- **Automation** — the scheduler heartbeat + `ScheduledJob` toggles/run-now, the
  Twitch EventSub subscription dashboard, and JustGiving ingestion status/fetch.
- **Theme** — overlay theme editor (colours, fonts, gradients).
- **Layouts** — named layout presets that place overlay elements on `/obs/full`.
- **Omnibar** — configure the omnibar's panels, milestones, overrides.
- **Chest announcer** — settings + sound triggers for the donation reader.
- **Audio / BRB / Logs & Queue** — music visualiser library, BRB timer,
  audit log + event queue.

Access is gated by the signed-in Clerk user's local `Profile` role (operator).

## OBS overlays (`/obs/*`)

Browser sources designed to be dropped into OBS. Public (no login) so they work
in OBS's unauthenticated browser; overlay-driven writes go through dedicated
`AllowAny` endpoints.

- **`/obs/omnibar`** — the info rail. A registry of **panels**
  (`routes/obs/omnibar/panels/`) rotate through lanes: current game, schedule,
  next objective, objective checklist, items collected, death count, donation
  reel + live-donation takeover, total raised, milestones, incentives, raffles,
  local time/playtime, charity cluster, Twitch event toasts, celebration banner,
  setpiece, BRB. Data comes from one polled/SSE **feed**
  (`hooks/useOmnibarFeed`) so each panel's `selectData` is a pure function over
  it.
- **`/obs/full`** & **`/obs/layout/:layout`** — full-screen composited layouts
  whose element placement is driven by the operator's `LayoutPreset`s.
- **`/obs/chest-announcer`** — a pixel hero walks on, opens a chest, holds each
  new donation overhead as a card (donor + amount + message) and reads it aloud
  via browser TTS; once read, the donation is marked announced so it never
  replays. Configurable sound triggers + pacing.
- **`/obs/tts`** — standalone donation TTS reader.
- **`/obs/brb`** — "be right back" countdown timer.
- **`/obs/audio-countdown`** — pre-stream / segment countdown.
- **Per-game scenes** (`routes/obs/scenes/`) — themed backdrops aggregated per
  franchise (zelda, mario, metroid, megaman, ff, …); `game-themes.ts`
  substring-matches the playing game to a scene module.

### Theming

A single `ThemeSettings` (CSS custom properties) drives both the control panel
chrome and the overlays — colours, gradients, and fonts update live as the
operator edits `/control/theme`. The control cards force readable light text
regardless of the active (possibly light) theme.

## Development

```sh
npm install
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # production build → dist/
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run format       # prettier
```

Under Docker, run the same via `docker compose exec frontend …` (e.g.
`docker compose exec frontend npx tsc --noEmit`). The dev server is bind-mounted
for HMR.

### Environment (`.env`)

- `VITE_API_URL` — API origin for local dev (defaults to `http://localhost:8000`).
- `VITE_PUBLIC_API_URL` — public API origin used when served over the tunnel.
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk key (set in `.env`, not docker-compose).

See `.env.example` for the annotated list.
