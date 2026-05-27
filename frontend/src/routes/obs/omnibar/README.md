# Omnibar v2

The omnibar is the 1920×96 broadcast layer pinned to the bottom of every
OBS source. It surfaces ~12 dynamic data streams (current game,
schedule, donations, incentives, milestones, charity info, local time,
playtime, objective, items, …) plus operator-triggered moments
(overrides, setpieces, boss-defeated celebrations, Twitch follow/sub/raid).

This README is for future contributors. Read it before adding a new
panel, event kind, mood, or data source.

## High-level layout

```
┌─ BRAND 220px ─┬──────────── LANES ────────────┬─ TOTAL 280px ─┐
│  twin chevron │  Top lane    (48px)            │  £ total      │
│  logo + bg    │  Bottom lane (48px)            │  + charity    │
└───────────────┴────────────────────────────────┴───────────────┘
```

Both lanes run their own rotation by default. An operator-triggered
override can take over one lane or both ("fullbar" mode where the
two-lane DOM collapses into a single 96px banner).

## Three-tier FSM

```
OmnibarFSM       modes: normal | urgent | celebrating | breaking
  └ LaneFSM × 2  modes: rotating | pinned | suspended | takeover
      └ PanelFSM (per panel instance)
```

A parallel `PlaythroughFSM` (one per `ScheduleEntry`) is *read-only*
context — the omnibar reacts to it but doesn't own it. Phases:

```
queued → preroll → live ⇄ paused ⇄ break → completed (or skipped)
                    │
                    └ sub-states: nominal | setpiece-imminent
                                | setpiece-active | celebrating
```

All four FSMs are plain `useReducer` discriminated unions in
`fsm/*.ts` — no external state library.

## Event bus

`bus/EventBus.tsx` exports `useBusEmit()` + `useBusSubscription(kind, handler)`.
The full event union is in `bus/types.ts`:

```
override-arrived | override-expired |
donation-arrived | playthrough-event | external-event |
milestone-reached | incentive-unlocked |
panel-complete | lane-suspend | lane-resume | ...
```

Pump streams subscribe events into the bus; FSMs and panels subscribe
out of it. One typed channel, easy to log.

## Push streams (input → bus)

Three streams feed events in. Each has an SSE source (instant) plus a
polling fallback (1.5s):

| Stream            | SSE                    | Polling                                      |
|-------------------|------------------------|----------------------------------------------|
| Overrides         | `event: override`      | `useOverrideStream` (also detects expiries)  |
| Playthrough events| `event: playthrough-event` | `usePlaythroughEventStream`              |
| External events   | `event: external-event`| `useExternalEventStream`                     |

SSE comes from `GET /api/stream/omnibar/`. Both SSE and the polls
share dedupe sets in `hooks/eventDedupe.ts` so whichever stream
delivers first wins.

## Three registries

Every extension point is a registry — add an entry, not a switch case.

### Panel registry — `panels/registry.ts`

```ts
registerPanel({
  id: 'donation-reel',
  component: DonationReelPanel,
  selectData: (feed) => /* compute props from polled feed; return null to hide */,
  minDurationMs: 8000,
  enabledWhen: (feed) => /* optional gate */,
});
```

`selectData` returning `null` removes the panel from rotation that tick.

### Event-handler registry — `events/registry.ts`

```ts
registerEventHandler({
  kind: 'twitch-follow',
  component: TwitchFollowPanel,
  flashMood: 'cheer',
  durationMs: 5000,
});
```

Driven by the `external-event` and `playthrough-event` bus streams.
Unknown kinds fall through to a generic toast (Twitch) or
`EventFlashPanel` (playthrough) so a new event source delivering an
unrecognised kind doesn't crash.

### Mood registry — `motion/moods.ts` + `motion/moods.css`

```ts
registerMood({ id: 'celebrate', className: 'mood--celebrate', durationMs: 2400 });
```

Applied as a CSS class on the omnibar root by the FSM. The class is
defined in `moods.css`; new moods need both a `registerMood` entry and
a `.mood--<id>` keyframe block.

## Self-registration

Panels and event handlers register via module side-effect at
import. `Omnibar.tsx` has a block of `import './panels/X'` lines
that triggers each file's `registerPanel(...)` call before the lanes
resolve panel ids. Same for `motion/moods` and the Twitch / event-flash
handlers.

When adding a panel:

1. Create `panels/MyPanel.tsx` with `function Panel(...)` + `registerPanel({...})`.
2. Add `import './panels/MyPanel'` to `Omnibar.tsx`'s side-effect block.
3. Add `'my-panel'` to `ALL_PANEL_IDS` in `hooks/useLayoutConfig.ts` so
   the layout editor can offer it.

## Layout JSON

`Event.omnibar_layout` (JSONField) drives lane composition:

```json
{
  "lanes": [
    { "id": "top",    "mode": "rotating", "intervalMs": 8000, "panels": ["current-game", "playtime"] },
    { "id": "bottom", "mode": "rotating", "intervalMs": 5000, "panels": ["schedule-next", "donation-reel", "incentives"] }
  ]
}
```

`Game.omnibar_layout` can override the event-level layout per game.
Resolution (per lane): game → event → defaults. Edit via
`/control/omnibar` → "Lane layout" section.

Unknown panel ids in the JSON are silently dropped so a stale layout
doesn't crash the bar.

## Bottom-lane takeover priority

When multiple takeovers want the bottom lane at once:

```
urgent override (bottom-targeted)
  → live donation (TTS + marquee)
    → Twitch external event (follow/sub/raid/bits)
      → playthrough event flash (boss-defeated, etc.)
        → rotation panel
```

Top-lane takeovers are reserved for top-targeted urgent overrides.

## Data feed — `hooks/useOmnibarFeed.ts`

Aggregates every polled stream into one `OmnibarFeed` object. Each
panel's `selectData` is a pure function over the feed, so it's easy
to test, memoise, and short-circuit. New polled data goes here.

## File map

```
omnibar/
├── Omnibar.tsx               root: mounts FSM, bus, lanes, registers panels
├── omnibar.css               core styles + timing tokens
├── README.md                 this file
├── bus/
│   ├── EventBus.tsx          context + useBusEmit + useBusSubscription
│   └── types.ts              OmnibarBusEvent union + phase types
├── fsm/
│   ├── omnibarMachine.ts     normal/urgent/celebrating/breaking
│   ├── laneMachine.ts        rotating/pinned/suspended/takeover
│   └── playthroughMachine.ts derives phase from backend fields
├── lanes/Lane.tsx            lane component + rotation timer
├── panels/
│   ├── registry.ts           registerPanel + PANELS map
│   ├── _shared/Row.tsx       tag pill + body primitive
│   ├── CurrentGamePanel.tsx  (and 11 other rotation panels)
│   ├── LiveDonationPanel.tsx (takeover w/ TTS + marquee)
│   ├── UrgentBannerPanel.tsx (takeover for urgent overrides)
│   ├── EventFlashPanel.tsx   (takeover for playthrough events)
│   └── TwitchPanels.tsx      (takeovers for follow/sub/raid/bits)
├── events/
│   └── registry.ts           registerEventHandler + EVENT_HANDLERS map
├── motion/
│   ├── moods.ts              registerMood + MOODS map
│   └── moods.css             .mood--celebrate, .mood--urgent, etc.
└── hooks/
    ├── useOmnibarFeed.ts     aggregate polled data → OmnibarFeed
    ├── useOmnibarSse.ts      EventSource subscriber (preferred)
    ├── useOverrideStream.ts  polling fallback for overrides
    ├── usePlaythroughEventStream.ts  polling fallback for playthrough events
    ├── useExternalEventStream.ts     polling fallback for external events
    ├── useLayoutConfig.ts    parse + merge Game ▶ Event ▶ defaults
    └── eventDedupe.ts        shared dedupe sets across SSE + polling
```

## Operator surfaces (`/control/omnibar`)

- **Sandbox** — fabricate Twitch events + donations (DEBUG-only).
- **Lane layout** — checklist + interval sliders, saves to `Event.omnibar_layout`.
- **Overrides** — kind + message + target lane + duration; live list.
- **Current objective** — operator-set free text on the active entry.
- **Setpiece** — imminent → active → cleared flow with operator presets.
- **Playthrough events** — quick buttons for boss-defeated etc.
- **Incentives** — CRUD + contribute; supports bid-war options (pipe-separated).
- **Milestones** — CRUD + mark reached.
- **External events** — viewer of unconsumed Twitch/Discord events.

## Adding a new feature — recipes

### A new rotation panel

1. `panels/MyPanel.tsx` with `registerPanel({id, component, selectData, minDurationMs})`
2. Import in `Omnibar.tsx`'s side-effect block.
3. Add id to `ALL_PANEL_IDS` in `useLayoutConfig.ts`.
4. (Optional) add to `DEFAULT_TOP.panels` or `DEFAULT_BOTTOM.panels`.

### A new event source (e.g. Discord)

1. Backend: webhook handler writes to `ExternalEvent` with `source='discord'`.
2. Frontend: nothing required — the omnibar polls/streams all sources.
3. Add a panel + `registerEventHandler({kind: 'discord-boost', component: ...})`.

### A new override kind

1. Pick a `kind` string.
2. Optionally add it to the dropdown in `/control/omnibar`'s Overrides section.
3. Override flows through `UrgentBannerPanel`; if you want kind-specific
   rendering, swap in a custom panel via `registerEventHandler`.

### A new mood

1. `motion/moods.ts` → `registerMood({id, className, durationMs})`.
2. `motion/moods.css` → `.mood--<id>` keyframe block.
3. FSMs apply it by adding the class to the omnibar root when they
   choose this mood.

### A new playthrough sub-state

The `live` state has a `sub` field — extend `LiveSubState` in
`bus/types.ts`, derive from backend fields in
`fsm/playthroughMachine.ts:deriveLiveSub`. Panels that want to read
the sub-state look it up via `feed.phase`.

## Transport priority

```
SSE      (~0.5s push) ── primary
Polling  (~1.5s pull) ── fallback, also handles expiries
```

Both write to the same dedupe sets in `eventDedupe.ts`. Don't add new
streams without joining that dedupe; otherwise duplicates land on
the bus.
