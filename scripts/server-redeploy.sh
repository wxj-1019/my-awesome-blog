#!/bin/bash
# 在服务器 /opt/my-awesome-blog 上执行：快速重建并滚动更新（默认用层缓存）
# 用法:
#   ./scripts/server-redeploy.sh              # 构建 frontend+backend 后 up
#   ./scripts/server-redeploy.sh frontend     # 仅前端
#   ./scripts/server-redeploy.sh backend      # 仅后端
#   ./scripts/server-redeploy.sh all --no-cache  # 全量无缓存（慢，排查用）
#   NO_MIGRATE=1 ./scripts/server-redeploy.sh frontend

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env.production)
TARGET="${1:-all}"
NO_CACHE="${2:-}"
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export COMPOSE_PARALLEL_LIMIT="${COMPOSE_PARALLEL_LIMIT:-1}"

if [ ! -f .env.production ]; then
  echo "错误: 缺少 .env.production"
  exit 1
fi

build_args=()
if [ "$NO_CACHE" = "--no-cache" ] || [ "${FORCE_NO_CACHE:-0}" = "1" ]; then
  build_args+=(--no-cache)
  echo "警告: 使用 --no-cache，构建会明显变慢"
fi

services=()
case "$TARGET" in
  frontend|fe) services=(frontend) ;;
  backend|be|api) services=(backend) ;;
  all|"") services=(backend frontend) ;;
  *)
    echo "未知目标: $TARGET (frontend|backend|all)"
    exit 1
    ;;
esac

echo "==== redeploy target=${services[*]} root=$ROOT ===="
set -a
# shellcheck disable=SC1091
source <(grep -v '^#' .env.production | sed '/^$/d')
set +a

echo "[build] ${services[*]}"
"${COMPOSE[@]}" build "${build_args[@]}" "${services[@]}"

echo "[up] rolling recreate changed services (volumes kept)"
# 不要 down 全栈：减少停机与 postgres 重启
"${COMPOSE[@]}" up -d --remove-orphans "${services[@]}"
# nginx 依赖 upstream，重建 app 后轻量 reload 配置
if docker ps --format '{{.Names}}' | grep -q 'my-awesome-blog-nginx'; then
  "${COMPOSE[@]}" up -d nginx 2>/dev/null || true
fi

if [ "${NO_MIGRATE:-0}" != "1" ] && printf '%s\n' "${services[@]}" | grep -qx backend; then
  echo "[migrate]"
  for i in $(seq 1 40); do
    st=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' my-awesome-blog-backend-1 2>/dev/null || echo missing)
    echo "  backend=$st ($i)"
    [ "$st" = "healthy" ] && break
    sleep 2
  done
  "${COMPOSE[@]}" exec -T backend alembic upgrade head || echo "migrate skipped/failed"
fi

echo "[status]"
"${COMPOSE[@]}" ps
curl -sS -o /dev/null -w "health:%{http_code}\n" http://127.0.0.1/health || true
curl -sS -o /dev/null -w "root:%{http_code}\n" http://127.0.0.1/ || true
echo "==== done ===="
