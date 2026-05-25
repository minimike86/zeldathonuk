# syntax=docker/dockerfile:1.7

# ──────────────────────────────────────────────────────────────────────────────
# Base — shared deps install layer
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# ──────────────────────────────────────────────────────────────────────────────
# Dev — used by docker compose with bind-mounted source for HMR
# ──────────────────────────────────────────────────────────────────────────────
FROM base AS dev
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ──────────────────────────────────────────────────────────────────────────────
# Build — produces static assets for Cloudflare Pages or any static host
# ──────────────────────────────────────────────────────────────────────────────
FROM base AS build
COPY . .
RUN npm run build

# ──────────────────────────────────────────────────────────────────────────────
# Prod — minimal nginx image serving the built assets (for self-hosted deploys)
# ──────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
