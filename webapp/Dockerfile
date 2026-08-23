# syntax=docker/dockerfile:1

# Dependencies are installed in their own stage so a source-only change reuses
# the cached npm ci layer.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Running as root would let a compromised render process write anywhere in the
# container; node:alpine gives us no non-root user by default.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
# standalone already contains the trimmed node_modules and server.js; static/
# is deliberately not part of it and has to be copied alongside.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
# Without this the server binds to localhost only and nothing outside the
# container can reach it.
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
