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

ARG APP_NAME
ARG APP_VERSION
ARG COMMIT_SHA
ENV APP_NAME=${APP_NAME}
ENV APP_VERSION=${APP_VERSION}
ENV COMMIT_SHA=${COMMIT_SHA}

USER node
EXPOSE 8000
ENV PORT=8000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
