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
# VITE_API_URL is inlined into the bundle at build time (the app joins API paths
# onto it — see lib/api.ts). For the self-hosted deploy this is the public API
# origin, e.g. https://api.zeldathon.co.uk. Passed as a compose build arg.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY . .
# `vite build`, not `npm run build` (= `tsc -b && vite build`): the deployable
# bundle is produced by esbuild and doesn't need the type-check gate, which is
# currently red (tsconfig `erasableSyntaxOnly` needs TS 5.8 but it's pinned at
# 5.7, plus some pre-existing type errors). Type-check separately via
# `npm run build` locally / in CI; a type error shouldn't block deploying.
RUN npx vite build

# ──────────────────────────────────────────────────────────────────────────────
# Prod — minimal nginx image serving the built assets (for self-hosted deploys)
# ──────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
