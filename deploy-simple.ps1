$ErrorActionPreference = "Stop"

Write-Host "=========================================="
Write-Host "  My Awesome Blog - 部署脚本"
Write-Host "=========================================="

$SERVER_IP = "49.234.190.85"
$SERVER_USER = "root"
$DEPLOY_PATH = "/opt/my-awesome-blog"

Write-Host ""
Write-Host "步骤 1/4: 测试 SSH 连接..." -ForegroundColor Cyan

try {
    $result = ssh -o ConnectTimeout=5 -o BatchMode=yes "${SERVER_USER}@${SERVER_IP}" "echo connected"
    if ($result -eq "connected") {
        Write-Host "SSH 连接成功!" -ForegroundColor Green
    }
} catch {
    Write-Host "错误: 无法连接到服务器 ${SERVER_USER}@${SERVER_IP}" -ForegroundColor Red
    Write-Host "请确保:"
    Write-Host "  1. SSH 密钥已添加到服务器"
    Write-Host "  2. 可以使用 'ssh root@49.234.190.85' 连接"
    exit 1
}

Write-Host ""
Write-Host "步骤 2/4: 检查 .env.production 文件..." -ForegroundColor Cyan

if (-not (Test-Path ".env.production")) {
    Write-Host "错误: .env.production 文件不存在" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content ".env.production" -Raw
if ($envContent -match "CHANGE_THIS") {
    Write-Host "错误: .env.production 中包含未修改的占位符" -ForegroundColor Red
    exit 1
}

Write-Host "环境配置文件检查通过!" -ForegroundColor Green

Write-Host ""
Write-Host "步骤 3/4: 创建远程目录并上传文件..." -ForegroundColor Cyan

ssh "${SERVER_USER}@${SERVER_IP}" "mkdir -p ${DEPLOY_PATH}"

$excludePatterns = @(
    "node_modules",
    ".next",
    "__pycache__",
    ".git",
    "*.pyc",
    ".env",
    ".env.local",
    "venv",
    ".venv",
    "logs",
    "*.log",
    ".trae"
)

$scpParams = @("-r")
foreach ($pattern in $excludePatterns) {
    $scpParams += "--exclude=$pattern"
}

$localFiles = @(
    "docker-compose.prod.yml",
    ".env.production",
    "nginx",
    "backend",
    "frontend"
)

foreach ($file in $localFiles) {
    if (Test-Path $file) {
        Write-Host "  上传: $file"
        scp -r $file "${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/"
    }
}

Write-Host "文件上传完成!" -ForegroundColor Green

Write-Host ""
Write-Host "步骤 4/4: 在服务器上构建和启动服务..." -ForegroundColor Cyan

$deployCommands = @(
    "cd ${DEPLOY_PATH}",
    "cp .env.production .env",
    "docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true",
    "docker image prune -f",
    "docker compose -f docker-compose.prod.yml build --no-cache",
    "docker compose -f docker-compose.prod.yml up -d",
    "sleep 15",
    "docker compose -f docker-compose.prod.yml ps",
    "docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head 2>/dev/null || echo Migration completed"
)

$commandStr = $deployCommands -join " && "

ssh "${SERVER_USER}@${SERVER_IP}" $commandStr

Write-Host ""
Write-Host "=========================================="
Write-Host "  部署完成!"
Write-Host "=========================================="
Write-Host ""
Write-Host "访问地址:" -ForegroundColor Cyan
Write-Host "  前端: http://${SERVER_IP}"
Write-Host "  后端 API: http://${SERVER_IP}/api/v1"
Write-Host "  API 文档: http://${SERVER_IP}/docs"
Write-Host ""
Write-Host "常用命令:" -ForegroundColor Cyan
Write-Host "  查看日志: ssh root@${SERVER_IP} 'docker compose -f /opt/my-awesome-blog/docker-compose.prod.yml logs -f'"
Write-Host "  重启服务: ssh root@${SERVER_IP} 'docker compose -f /opt/my-awesome-blog/docker-compose.prod.yml restart'"
Write-Host "  停止服务: ssh root@${SERVER_IP} 'docker compose -f /opt/my-awesome-blog/docker-compose.prod.yml down'"
Write-Host ""
