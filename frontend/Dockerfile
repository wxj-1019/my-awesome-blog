# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS base

ENV HTTP_PROXY="" HTTPS_PROXY="" http_proxy="" https_proxy=""

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
# BuildKit cache：依赖未变时 npm ci 几乎秒过；仍用国内 registry
RUN --mount=type=cache,target=/root/.npm \
    npm config set registry https://registry.npmmirror.com && \
    npm ci --legacy-peer-deps --ignore-scripts

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 必须用 compose/build --build-arg 传入公网 URL；无默认 localhost，避免打进客户端
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# 去掉可能覆盖 build-arg 的 env 文件
RUN rm -f .env.production .env.local .env.development .env || true \
  && echo "BUILD SITE=$NEXT_PUBLIC_SITE_URL" \
  && echo "BUILD API_BASE=$NEXT_PUBLIC_API_BASE_URL" \
  && echo "BUILD API_URL=$NEXT_PUBLIC_API_URL" \
  && test -n "$NEXT_PUBLIC_SITE_URL" \
  && test -n "$NEXT_PUBLIC_API_BASE_URL" \
  && test -n "$NEXT_PUBLIC_API_URL"

RUN npx next telemetry disable
# Next 编译缓存挂载：源码小改时显著加速 rebuild
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
