# syntax=docker/dockerfile:1.7

# ──────────────────────────────────────────────────────────────────────────────
# Base — Python deps install layer
# ──────────────────────────────────────────────────────────────────────────────
FROM python:3.13-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# System packages: postgres client libs only (psycopg[binary] bundles libpq)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install -r requirements.txt

# ──────────────────────────────────────────────────────────────────────────────
# Dev — bind-mounted source via docker compose, runs Django dev server
# ──────────────────────────────────────────────────────────────────────────────
FROM base AS dev
COPY . .
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# ──────────────────────────────────────────────────────────────────────────────
# Prod — gunicorn, used by Fly.io
# ──────────────────────────────────────────────────────────────────────────────
FROM base AS prod
COPY . .
RUN python manage.py collectstatic --noinput
EXPOSE 8000
CMD ["gunicorn", "zeldathon.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--access-logfile", "-"]
