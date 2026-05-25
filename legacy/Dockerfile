# syntax=docker/dockerfile:1.7
#
# Legacy Angular 13 app. Pinned to Node 16 — newer Node breaks the OpenSSL
# provider Angular 13's Webpack expects. Using Debian (bullseye-slim) over
# Alpine since Angular 13's older binary deps don't all ship musl prebuilts.
#
# Host / port / disableHostCheck / poll are baked into legacy/angular.json
# so CLI-flag translation quirks in WDS v4 can't sabotage us.

FROM node:16-bullseye-slim AS dev

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY . .

EXPOSE 4200
CMD ["npx", "ng", "serve"]
