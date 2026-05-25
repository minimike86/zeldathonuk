# ZeldathonUK

Source for the [ZeldathonUK](https://www.zeldathon.co.uk/) website.

## Stack

- **Frontend:** React 19 + Vite 7 + TypeScript + Tailwind v4 + shadcn/ui + React Router 7
- **Auth:** _not wired yet_ — [Clerk](https://clerk.com) planned later
- **Backend:** Django 5 + Django REST Framework
- **Database:** Postgres (Neon in production, local Postgres via Docker in dev)
- **Hosting:** Cloudflare Pages (frontend) + Fly.io (backend)

## Repo layout

```
.
├── frontend/         React + Vite app
├── backend/          Django REST API
├── legacy/           Original Angular 13 app (read-only, kept for reference)
├── docker-compose.yml
└── README.md
```

## Running locally

You need Docker Desktop and a Clerk account. Once you've created `.env` files (see below):

```sh
docker compose up
```

That brings up:

- Postgres on `localhost:5432`
- Django API on `http://localhost:8000`
- Vite dev server on `http://localhost:5173`

Live-reload works for both the frontend (Vite HMR) and backend (Django dev server). Source folders are bind-mounted into the containers.

### Required environment files

Copy and fill in:

```sh
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

The defaults work out of the box for local dev. Third-party API tokens (Tiltify / JustGiving / Twitch) only need filling in once those proxy endpoints are wired up.

### Without Docker

- **Frontend:** `cd frontend && npm install && npm run dev`
- **Backend:** `cd backend && pip install -e . && python manage.py migrate && python manage.py runserver`

You'll need to point `DATABASE_URL` at a Postgres you're running yourself.

## Production

- **Frontend → Cloudflare Pages:** build command `npm run build`, output `dist/`, root `frontend/`.
- **Backend → Fly.io:** uses `backend/Dockerfile` (target `prod`). Set `DATABASE_URL` to a Neon connection string in Fly secrets.

## Legacy

The original Angular app lives in `legacy/` and is no longer maintained. It's behind a docker-compose profile so it doesn't start by default:

```sh
docker compose --profile legacy up legacy
```

Then visit `http://localhost:4200`.
