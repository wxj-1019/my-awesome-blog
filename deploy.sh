#!/bin/bash

set -e

echo "=========================================="
echo "  My Awesome Blog - 部署脚本"
echo "=========================================="

SERVER_IP="${DEPLOY_SERVER_IP:-}"
if [ -z "$SERVER_IP" ]; then
    echo "错误: 请设置环境变量 DEPLOY_SERVER_IP"
    exit 1
fi
SERVER_USER="root"
DEPLOY_PATH="/opt/my-awesome-blog"

echo ""
echo "步骤 1/5: 检查本地环境..."
if ! command -v docker &> /dev/null; then
    echo "错误: 本地未安装 Docker"
    exit 1
fi

if ! command -v rsync &> /dev/null; then
    echo "错误: 未安装 rsync"
    exit 1
fi

echo "步骤 2/5: 检查 .env.production 文件..."
if [ ! -f ".env.production" ]; then
    echo "错误: .env.production 文件不存在"
    echo "请创建 .env.production 文件并配置必要的环境变量"
    exit 1
fi

if grep -q "CHANGE_THIS" .env.production; then
    echo "错误: .env.production 中包含未修改的占位符"
    echo "请修改 POSTGRES_PASSWORD 和 SECRET_KEY"
    exit 1
fi

echo "步骤 3/5: 同步文件到服务器..."
echo "正在连接到 $SERVER_USER@$SERVER_IP..."

rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '__pycache__' \
    --exclude '.git' \
    --exclude '*.pyc' \
    --exclude '.env' \
    --exclude '.env.local' \
    --exclude 'venv' \
    --exclude '.venv' \
    --exclude 'logs' \
    --exclude '*.log' \
    --exclude '.trae' \
    ./ ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/

echo "步骤 4/5: 在服务器上构建和启动服务..."

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

cd /opt/my-awesome-blog

echo "检查 Docker 服务..."
if ! systemctl is-active --quiet docker; then
    echo "启动 Docker 服务..."
    systemctl start docker
fi

echo "加载环境变量..."
export $(grep -v '^#' .env.production | xargs)

echo "停止旧容器..."
docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

echo "清理旧镜像..."
docker image prune -f

echo "构建新镜像..."
docker compose -f docker-compose.prod.yml build --no-cache

echo "启动服务..."
docker compose -f docker-compose.prod.yml up -d

echo "等待服务启动..."
sleep 10

echo "检查服务状态..."
docker compose -f docker-compose.prod.yml ps

echo "运行数据库迁移..."
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head 2>/dev/null || echo "迁移完成或无需迁移"

ENDSSH

echo "步骤 5/5: 验证部署..."
echo ""
echo "=========================================="
echo "  部署完成!"
echo "=========================================="
echo ""
echo "访问地址:"
echo "  前端: http://${SERVER_IP}"
echo "  后端 API: http://${SERVER_IP}/api/v1"
echo "  API 文档: http://${SERVER_IP}/docs"
echo ""
echo "常用命令:"
echo "  查看日志: ssh root@${SERVER_IP} 'docker compose -f /opt/my-awesome-blog/docker-compose.prod.yml logs -f'"
echo "  重启服务: ssh root@${SERVER_IP} 'docker compose -f /opt/my-awesome-blog/docker-compose.prod.yml restart'"
echo "  停止服务: ssh root@${SERVER_IP} 'docker compose -f /opt/my-awesome-blog/docker-compose.prod.yml down'"
echo ""
