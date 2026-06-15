# Stage 1: build the Next.js standalone output
FROM node:20-bookworm-slim AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Stage 2: production runtime with TeX Live
FROM node:20-bookworm-slim AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       texlive-xetex \
       texlive-fonts-recommended \
       texlive-latex-extra \
       fontconfig \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the standalone server and static assets from the build stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# This will be bind-mounted in production, but we create it so the
# container can start even without a mount.
RUN mkdir -p /app/projects

EXPOSE 7474

ENV PORT=7474
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
