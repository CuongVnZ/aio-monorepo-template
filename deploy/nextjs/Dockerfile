# Use the official Node.js 18 image as the base image
FROM --platform=linux/amd64 node:18-alpine AS base

# Install dependencies only when needed
FROM base AS builder
RUN apk update
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    python3 \
    make \
    g++ \
    build-base

WORKDIR /app

RUN npm install -g pnpm && pnpm i turbo@^2.3.3 --prod
COPY . .
RUN pnpm turbo prune @acme/nextjs --docker

FROM base AS installer

RUN apk update
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    python3 \
    make \
    g++ \
    build-base
WORKDIR /app

COPY --from=builder /app/out/json/ .
RUN npm install -g pnpm && pnpm install

COPY --from=builder /app/out/full/ .

# Define ARGs for build-time variables
ARG NODE_ENV
ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_APP_URL

# Set environment variables
ENV NODE_ENV=$NODE_ENV
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN echo "SKIP_ENV_VALIDATION=true" >> apps/nextjs/.env
ENV NODE_OPTIONS=--max_old_space_size=8192

RUN pnpm generate
RUN pnpm turbo build --filter=nextjs

# Remove env after build
RUN rm -f apps/nextjs/.env

FROM base AS runner

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

RUN apk update
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/nextjs/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/nextjs/.next/static ./apps/nextjs/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/nextjs/public ./apps/nextjs/public
COPY --from=installer --chown=nextjs:nodejs /app/apps/nextjs/package.json ./apps/nextjs/package.json
COPY --from=installer --chown=nextjs:nodejs /app/apps/nextjs/next.config.js ./apps/nextjs/next.config.js

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/nextjs/server.js"] 