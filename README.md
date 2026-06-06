# ZeldathonUK

Source for the [ZeldathonUK](https://www.zeldathon.co.uk/) website — the public
fundraiser site **plus** the full broadcast toolkit that runs the live charity
marathon: an operator control panel and a suite of OBS browser-source overlays,
backed by a Django REST API that integrates donations (JustGiving, Tiltify,
Twitch Charity) and live Twitch automation.

## Stack

- **Frontend:** React 19 + Vite 7 + TypeScript, React Router 7, Bootstrap 5
  (control panel), FontAwesome + lucide icons, `@dnd-kit` for drag-and-drop
  editors. See [`frontend/README.md`](frontend/README.md).
- **Auth:** [Clerk](https://clerk.com) for sign-in; a local `Profile` row owns
  authorization (viewer / operator RBAC). Reads are public; writes need the
  operator role.
- **Backend:** Django 5 + Django REST Framework, `django-unfold` admin. See
  [`backend/README.md`](backend/README.md).
- **Database:** Postgres (local via Docker in dev; a managed Postgres in prod).
- **Realtime:** SSE for low-latency overlay pushes, with polling fallback.
- **Hosting:** self-hosted Docker stack published through a Cloudflare Tunnel
  (`cloudflared`); `backend/fly.toml` is kept for an alternative Fly.io backend
  deploy.

## What's in here

| Area | Lives at | What it does |
|------|----------|--------------|
| **Public site** | `frontend` → `/`, `/schedule`, `/incentives`, `/donations`, `/charity`, `/history`, `/donate` | Marathon homepage, live schedule, incentives/raffles, donation totals + donor wall, charity info. |
| **Control panel** | `frontend` → `/control/*` (operator-only) | The operator cockpit: schedule + run timer, item/objective checklists, donations moderation, events/games/runners/charities/raffles, Twitch automation, overlay theming + layouts, automation/scheduler, logs. |
| **OBS overlays** | `frontend` → `/obs/*` | Browser sources for OBS: the omnibar info rail, full-screen layouts, chest-announcer donation reader, TTS reader, BRB timer, audio countdown, per-game scenes. |
| **API + integrations** | `backend` → `/api/*` | REST API, Clerk-auth RBAC, donation ingest (JustGiving/Tiltify/Twitch Charity), Twitch EventSub + chat/predictions/shoutouts/rewards, an in-stack job scheduler, IGDB/OCRemix/Zelda-wiki enrichment. |

A high-level feature catalogue lives in the two sub-READMEs; this file covers
how the pieces fit together and how to run them.

## Repo layout

```
.
├── frontend/          React + Vite app (public site, control panel, OBS overlays)
├── backend/           Django REST API + integrations + admin
├── legacy/            Original Angular 13 app (read-only, kept for reference)
├── screenshots/
├── docker-compose.yml
└── README.md
```

## Running locally

You need Docker Desktop and (for sign-in) a Clerk account. Create the env files,
then bring the stack up:

```sh
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
docker compose up
```

That starts:

- **postgres** on `localhost:5432`
- **backend** (Django, auto-migrates) on `http://localhost:8000`
- **scheduler** — a second backend container running `run_scheduled_jobs --loop`
  that drives the enabled periodic jobs (donation polling, chat reminders,
  shoutout draining) with a DB heartbeat. Managed from `/control/automation`.
- **frontend** (Vite dev server, HMR) on `http://localhost:5173`

Source folders are bind-mounted, so both the Vite HMR and the Django dev server
live-reload on edits.

The control panel is at `http://localhost:5173/control`; OBS overlays at
`http://localhost:5173/obs/...`. Sign in with Clerk, then promote your local
`Profile` to **operator** in the Django admin (`/admin` → Auth & access) to get
write access.

### Environment

The committed defaults work out of the box for local dev. Third-party
credentials (Twitch client + user OAuth, JustGiving App ID, Tiltify token) are
only needed to exercise those integrations — see `backend/.env.example` for the
full annotated list.

### Without Docker

- **Frontend:** `cd frontend && npm install && npm run dev`
- **Backend:** `cd backend && pip install -r requirements.txt && python manage.py migrate && python manage.py runserver`

Point `DATABASE_URL` at a Postgres you run yourself.

## Production

The production site is the same Docker stack published through a **Cloudflare
Tunnel** (`cloudflared` service):

- `www` / apex → the `web` service (the `prod` nginx build of the SPA — bring it
  up with `docker compose --profile web up -d --build web`).
- `api` → the `backend` service.

`frontend/src/lib/env.ts` resolves the API origin from the page host, so the
public site (separate origin) talks to `api.<domain>` while local dev stays on
`localhost`. `backend/fly.toml` (target `prod` of `backend/Dockerfile`) is kept
as an alternative way to host just the API on Fly.io.

## Tests

```sh
docker compose exec backend python manage.py test api   # backend (DRF + integrations)
docker compose exec frontend npx tsc --noEmit            # frontend type-check
docker compose exec frontend npm run lint                # frontend lint
```

## Legacy

The original Angular app lives in `legacy/` and is unmaintained, behind a compose
profile so it doesn't start by default:

```sh
docker compose --profile legacy up legacy   # then http://localhost:4200
```
