# ZeldathonUK — Backend

Django 5 + Django REST Framework API that powers the public site, the operator
control panel, and the OBS overlays. It owns the data model (schedule, games,
donations, charities, overlays) and every third-party integration (Twitch,
JustGiving, Tiltify, IGDB, OCRemix, the Zelda wiki).

Everything lives in a single Django app, `api/`.

## Stack

- **Django 5.1 + DRF 3.15**, `django-environ` config, `dj-database-url`.
- **Postgres** via `psycopg` 3.
- **Auth:** Clerk-issued RS256 JWTs verified against Clerk's JWKS
  (`PyJWT[crypto]`); local `Profile` rows carry the role.
- **Admin:** `django-unfold` skin over the Django admin.
- **Static:** `whitenoise`; **WSGI:** `gunicorn` in prod.
- **Helpers:** `requests` (all outbound APIs), `howlongtobeatpy` (playtime
  estimates).

## Authentication & authorization

- `api/authentication.py` — `ClerkJWTAuthentication`: verifies the bearer JWT
  against each trusted Clerk issuer's JWKS, lazily creating a Django `User` +
  `Profile` on first valid token. Multiple issuers are trusted at once (a dev
  Clerk instance for `localhost` and a prod instance for the public site).
- `api/permissions.py` — `ReadOnlyOrOperator`: GET/HEAD/OPTIONS are public;
  any write requires an authenticated user whose `Profile.role == operator`.
  Overlay-driven write endpoints (OBS browser sources are unauthenticated) opt
  into `AllowAny` explicitly.
- `AuthConfig` (admin-editable) can override the trusted Clerk issuers,
  authorized parties, and CORS origins live, without a redeploy.

## Data model (`api/models.py`)

Grouped by area — see the model docstrings for specifics.

- **Schedule & runs:** `Game`, `Runner`, `Event`, `ScheduleEntry`, `TimerRun`,
  `CurrentlyPlaying`. A run timer with server-stamped splits drives the
  overlays and a Stream-Deck hotkey endpoint.
- **Game checklists:** `GameItem`, `GameItemSet`, `CollectedItem`,
  `GameObjective` (with optional `linked_item` so "item get" objectives inherit
  the item's sprite), `ObjectiveStatus`, `ScheduleEntryObjective`, `Setpiece`
  (dungeon/boss automation driven off objective completion).
- **Donations:** `Donation` (normalised across platforms; `mute_reason` /
  `is_muted` for moderation), `DonationPage` (per-event JustGiving/Tiltify/…
  pages with cached aggregate totals), `DonationPlatform(Profile)`.
- **Incentives & raffles:** `Incentive`, `Milestone` (with `announced` replay
  guard), `Raffle`, `RaffleWinner`.
- **Charities:** `Charity` + `CharityWebsite/SocialLink/Video/Image/ImpactTier`,
  `EventCharity`, `CharitySlide`.
- **Twitch:** `TwitchOAuthToken`, `TwitchChannelConnection`, `EventTwitchChannel`
  (per-event channels, charity tracking), `TwitchCharityCampaign`,
  `ChatAnnouncement` + `ChatTrigger` + `AnnouncementColor`, `RecurringChatMessage`,
  `TwitchPrediction`, `RewardMapping` + `RewardAction`, `ShoutoutRequest` +
  `ShoutoutConfig`.
- **Overlays & theming:** `ThemeSettings`, `LayoutPreset`, `LayoutGuideSettings`,
  `PlaythroughEvent`, `OmnibarOverride`, `ExternalEvent`, `BrbTimer`,
  `ChestAnnouncerSettings` + `ChestAnnouncerSoundTrigger`, `ScheduleEntrySoundTrigger`
  + `SoundAsset`, `TtsNowReading` / `TtsReplay` / `ChestReplay` (overlay
  hand-off singletons), `AudioTrack` / `NowPlayingAudio`.
- **Ops:** `ScheduledJob` + `SchedulerHeartbeat` (the in-stack scheduler),
  `ActivityLog`, `Profile`, `AuthConfig`.

## Integrations

Each external service is a focused module:

- **`twitch.py`** — Helix client (app + per-channel user tokens, auto-refresh):
  push the schedule, live-status probe, update category/title on game change,
  custom-reward lookups, chat announcements, shoutouts, charity campaign +
  donation polling.
- **`eventsub.py`** — Twitch EventSub webhook intake (follows / subs / cheers /
  raids / charity donations / channel-point redemptions). Charity donations are
  funnelled into the normal `Donation` pipeline; other events become
  `ExternalEvent`s the omnibar polls. Includes the subscription sync/prune
  dashboard backend.
- **`chat.py`** — chat-announcement templating + send path, broadcasting to every
  charity-connected channel; recurring messages.
- **`rewards.py` / `shoutouts.py`** — channel-point reward → action mappings;
  cooldown-managed shoutout queue (donors + raiders).
- **`webhooks.py`** — JustGiving / Tiltify / generic donation webhook intake; the
  shared `_ingest` writer (dedupes on `(platform, external_id)`, fires the
  milestone signal).
- **`justgiving.py`** — polling-only JustGiving ingest (no native webhooks):
  per-event page donations + cached aggregate page totals (so completed/past
  events' totals stay visible even after the itemised feed empties). Handles
  production/staging APIs.
- **`igdb.py` / `ocremix.py` / `zeldawiki.py`** — metadata enrichment: IGDB
  game art/metadata, OCRemix music scraping for the audio visualiser, and Zelda
  wiki item-sprite import (parses both `<gallery>` wikitext and the newer
  `{{Gallery List}}` template via rendered HTML, with base-game fallback for
  remakes/HD editions).
- **`sse.py`** — Server-Sent-Events stream the omnibar prefers for low-latency
  overrides / playthrough / external events (falls back to polling).
- **`sandbox.py`** — DEBUG-only endpoints to fabricate Twitch events / donations /
  charity campaigns for rehearsal.
- **`audio.py`** — audio playlist + CORS proxy for the music visualiser.
- **`dev_scenes.py`** — DEBUG-only helper that the scene tooling uses to edit the
  frontend scene modules.

## Scheduler

`run_scheduled_jobs` ticks the enabled `ScheduledJob` rows (each a management
command, e.g. `poll_donations --twitch`, `post_chat_reminders`,
`process_shoutouts`). It runs as its own `scheduler` container
(`run_scheduled_jobs --loop`) and writes a `SchedulerHeartbeat` each pass so
`/control/automation` can show whether it's alive. `api/jobs.py` captures each
job's status/output onto the row; the panel also offers "Run now".

## Management commands (`api/management/commands/`)

- `populate_zelda_data` / `seed_walkthroughs` — seed the curated game catalogue.
- `import_zelda_items` — sync per-game item sprites from the Zelda wiki
  (`--download` fetches them into the frontend assets folder).
- `poll_donations` — pull recent Tiltify / JustGiving / Twitch Charity donations.
- `post_chat_reminders` / `process_shoutouts` — recurring chat + shoutout queue.
- `twitch_login` / `twitch_eventsub` — bootstrap user OAuth; register EventSub subs.
- `scrape_ocremix` / `prewarm_audio_cache` — music for the visualiser.
- `prune_activity_log` — trim the audit log.
- `run_scheduled_jobs` — the scheduler tick / loop.

## API surface

Routes are registered in `api/urls.py` — a DRF router for the CRUD viewsets plus
explicit paths for actions and integrations. Highlights:

- Resource viewsets: `games`, `game-items`, `game-objectives`, `runners`,
  `events`, `schedule`, `donations`, `donation-pages`, `incentives`,
  `milestones`, `raffles`, `charities` (+ related), `event-twitch-channels`,
  `chat-announcements`, `twitch-predictions`, `reward-mappings`, `scheduled-jobs`,
  `themes`, `layout-presets`, … (see `urls.py`).
- Overlay state: `currently-playing/`, `tts/now-reading/`, `tts/replay/`,
  `chest-announcer/{settings,replay}/`, `theme/`, `layout-guide/`, `brb/current/`,
  `stream/omnibar/` (SSE).
- Donations: `donations/totals/`, `donations/<id>/mark_read/`,
  `donations/<id>/mark_announced/` *(milestones)*, `justgiving/{status,test}/`,
  `donation-pages/<id>/sync_total/`, webhook intakes under `webhooks/`.
- Twitch: `twitch/{push-schedule,stream-status,charity-campaign,rewards}/`,
  `twitch/connect/{start,poll}/`, `twitch/eventsub/` (intake) +
  `twitch/eventsub/{subscriptions,sync}/`, `twitch/chat/send/`, `twitch/emotes/`.
- Ops: `me/`, `queue/`, `scheduler-status/`, `activity-log/`, `uploads/image/`,
  `healthz/`, and DEBUG-only `sandbox/*` + `dev/scenes/*`.

## Development

Run everything through Docker (the host Python lacks the deps):

```sh
docker compose exec backend python manage.py makemigrations api
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py test api           # full suite
docker compose exec backend python manage.py test api.tests.test_justgiving
docker compose exec backend python manage.py shell
```

Tests live in `api/tests/`. The Django admin (`django-unfold`) is at `/admin`.
