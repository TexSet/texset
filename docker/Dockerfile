# Multi-stage build. We compile the app and the better-sqlite3 native module in
# a builder stage that has the toolchain, then ship a lean runtime that only
# carries Node, TeX Live, and the standalone server output.

FROM node:20-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# install dependencies (needs a C++ toolchain to build better-sqlite3)
FROM base AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# build the next.js standalone output
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# runtime image: Node + TeX Live (xelatex) + the built app
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# the full TeX Live so any package a document needs is already there, including
# language support like babel-spanish. it makes the image large, but it means
# documents just compile instead of failing on a missing package.
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-full \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=7474
# bind to all interfaces so the published port reaches the standalone server
ENV HOSTNAME=0.0.0.0
ENV TEXSET_DATA_DIR=/app/projects

# run as the non-root user that ships with the node image
RUN mkdir -p /app/projects && chown -R node:node /app
USER node

# standalone output bundles the server and its node_modules (better-sqlite3 included)
COPY --chown=node:node --from=builder /app/.next/standalone ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static
COPY --chown=node:node --from=builder /app/public ./public

EXPOSE 7474
CMD ["node", "server.js"]
