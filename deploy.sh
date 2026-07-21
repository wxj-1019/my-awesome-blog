#!/bin/bash
# 本机 → 服务器同步代码并快速重建（默认使用 Docker 层缓存）
# 环境变量:
#   DEPLOY_SERVER_IP   必填
#   DEPLOY_PATH        默认 /opt/my-awesome-blog
#   DEPLOY_TARGET      frontend|backend|all  默认 all
#   FORCE_NO_CACHE=1   强制无缓存全量构建
#   SKIP_SYNC=1        跳过 rsync（代码已在服务器）

set -euo pipefail

echo "=========================================="
echo "  My Awesome Blog - 快速部署"
echo "=========================================="

SERVER_IP="${DEPLOY_SERVER_IP:-}"
if [ -z "$SERVER_IP" ]; then
    echo "错误: 请设置环境变量 DEPLOY_SERVER_IP"
    exit 1
fi
SERVER_USER="${DEPLOY_SERVER_USER:-root}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/my-awesome-blog}"
DEPLOY_TARGET="${DEPLOY_TARGET:-all}"

echo ""
echo "步骤 1/4: 检查本地环境..."
if ! command -v docker &> /dev/null; then
    echo "提示: 本地可不装 Docker；构建在服务器执行"
fi
if ! command -v rsync &> /dev/null && [ "${SKIP_SYNC:-0}" != "1" ]; then
    echo "错误: 未安装 rsync（或设置 SKIP_SYNC=1 并在服务器自行更新代码）"
    exit 1
fi

echo "步骤 2/4: 检查 .env.production..."
if [ ! -f ".env.production" ]; then
    echo "错误: .env.production 文件不存在"
    exit 1
fi
if grep -q "CHANGE_THIS" .env.production; then
    echo "错误: .env.production 中包含未修改的占位符"
    exit 1
fi

if [ "${SKIP_SYNC:-0}" != "1" ]; then
    echo "步骤 3/4: 同步文件到 ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/ ..."
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.next' \
        --exclude '__pycache__' \
        --exclude '.git' \
        --exclude '*.pyc' \
        --exclude '.env' \
        --exclude '.env.local' \
        --exclude '.env.production' \
        --exclude 'venv' \
        --exclude '.venv' \
        --exclude 'logs' \
        --exclude '*.log' \
        --exclude '.trae' \
        --exclude '.tmp-ssh-venv' \
        --exclude '.tmp-*' \
        ./ "${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/"
else
    echo "步骤 3/4: 跳过同步 (SKIP_SYNC=1)"
fi

echo "步骤 4/4: 服务器重建 (${DEPLOY_TARGET})..."
NO_CACHE_FLAG=""
if [ "${FORCE_NO_CACHE:-0}" = "1" ]; then
  NO_CACHE_FLAG="--no-cache"
fi
# shellcheck disable=SC2029
ssh "${SERVER_USER}@${SERVER_IP}" \
  "cd '${DEPLOY_PATH}' && \
   if [ -f scripts/server-redeploy.sh ]; then \
     bash scripts/server-redeploy.sh '${DEPLOY_TARGET}' ${NO_CACHE_FLAG}; \
   else \
     export DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1; \
     docker compose -f docker-compose.prod.yml --env-file .env.production build ${NO_CACHE_FLAG} backend frontend; \
     docker compose -f docker-compose.prod.yml --env-file .env.production up -d; \
     docker compose -f docker-compose.prod.yml --env-file .env.production exec -T backend alembic upgrade head || true; \
   fi"

echo ""
echo "=========================================="
echo "  部署完成!"
echo "=========================================="
echo "  前端: http://${SERVER_IP}"
echo "  API:  http://${SERVER_IP}/api/v1"
echo "  Docs: http://${SERVER_IP}/docs"
echo ""
echo "加速提示:"
echo "  只更前端: DEPLOY_TARGET=frontend ./deploy.sh"
echo "  只更后端: DEPLOY_TARGET=backend ./deploy.sh"
echo "  全量无缓存排查: FORCE_NO_CACHE=1 ./deploy.sh"
echo ""
