# Based on https://github.com/vercel/next.js/blob/0549233/examples/with-docker-multi-env/docker/production/Dockerfile
FROM node:23-alpine AS base

FROM base AS deps
RUN apk add --no-cache gcompat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER node
EXPOSE 8000
ENV PORT=8000
CMD ["node", "server.js"]
