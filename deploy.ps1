$ErrorActionPreference = "Stop"

Write-Host "=========================================="
Write-Host "  My Awesome Blog - 部署脚本"
Write-Host "=========================================="

$SERVER_IP = $env:DEPLOY_SERVER_IP
if (-not $SERVER_IP) {
    Write-Host "错误: 请设置环境变量 DEPLOY_SERVER_IP" -ForegroundColor Red
    exit 1
}
$SERVER_USER = "root"
$DEPLOY_PATH = "/opt/my-awesome-blog"

Write-Host ""
Write-Host "步骤 1/5: 检查本地环境..."

$sshAvailable = Get-Command ssh -ErrorAction SilentlyContinue
if (-not $sshAvailable) {
    Write-Host "错误: 未找到 ssh 命令，请确保 OpenSSH 已安装" -ForegroundColor Red
    exit 1
}

Write-Host "步骤 2/5: 检查 .env.production 文件..."
if (-not (Test-Path ".env.production")) {
    Write-Host "错误: .env.production 文件不存在" -ForegroundColor Red
    Write-Host "请创建 .env.production 文件并配置必要的环境变量"
    exit 1
}

$envContent = Get-Content ".env.production" -Raw
if ($envContent -match "CHANGE_THIS") {
    Write-Host "错误: .env.production 中包含未修改的占位符" -ForegroundColor Red
    Write-Host "请修改 POSTGRES_PASSWORD 和 SECRET_KEY"
    exit 1
}

Write-Host "步骤 3/5: 测试 SSH 连接..."
$testResult = ssh -o ConnectTimeout=5 -o BatchMode=yes "${SERVER_USER}@${SERVER_IP}" "echo 'connected'" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 无法连接到服务器 ${SERVER_USER}@${SERVER_IP}" -ForegroundColor Red
    Write-Host "请确保:"
    Write-Host "  1. SSH 密钥已添加到服务器"
    Write-Host "  2. 可以使用 'ssh root@${SERVER_IP}' 连接"
    exit 1
}
Write-Host "SSH 连接成功!"

Write-Host "步骤 4/5: 同步文件到服务器..."
Write-Host "正在连接到 $SERVER_USER@$SERVER_IP..."

$excludeArgs = @(
    "--exclude", "node_modules",
    "--exclude", ".next",
    "--exclude", "__pycache__",
    "--exclude", ".git",
    "--exclude", "*.pyc",
    "--exclude", ".env",
    "--exclude", ".env.local",
    "--exclude", "venv",
    "--exclude", ".venv",
    "--exclude", "logs",
    "--exclude", "*.log",
    "--exclude", ".trae"
)

$excludeStr = $excludeArgs -join " "

$remoteCommands = @(
    "mkdir -p ${DEPLOY_PATH}",
    "rsync -avz --progress ${excludeStr} ./ ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/"
)

$secondRemoteCommands = @(
    "cd ${DEPLOY_PATH}",
    "export ``grep -v '^#' .env.production | xargs``",
    "docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true",
    "docker image prune -f",
    "docker compose -f docker-compose.prod.yml build --no-cache",
    "docker compose -f docker-compose.prod.yml up -d",
    "sleep 10",
    "docker compose -f docker-compose.prod.yml ps",
    "docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head 2>/dev/null || echo 'Migration complete or not needed'"
)

$secondCmdStr = $secondRemoteCommands -join " && "

$wslCommands = @(
    "mkdir -p ${DEPLOY_PATH}",
    "rsync -avz --progress ${excludeStr} /mnt/e/A_Project/my-awesome-blog/ ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/",
    "ssh ${SERVER_USER}@${SERVER_IP} `"cd ${DEPLOY_PATH} && export \``(grep -v '^#' .env.production | xargs\`` && docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true && docker image prune -f && docker compose -f docker-compose.prod.yml build --no-cache && docker compose -f docker-compose.prod.yml up -d && sleep 10 && docker compose -f docker-compose.prod.yml ps`""
)

$wslCmd = $wslCommands -join "; "

Write-Host "使用 WSL 进行部署..."

wsl bash -c $wslCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "  部署完成!"
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "访问地址:"
    Write-Host "  前端: http://${SERVER_IP}"
    Write-Host "  后端 API: http://${SERVER_IP}/api/v1"
    Write-Host "  API 文档: http://${SERVER_IP}/docs"
    Write-Host ""
    Write-Host "常用命令:"
    Write-Host "  查看日志: ssh root@${SERVER_IP} 'docker compose -f /opt/my-awesome-blog/docker-compose.prod.yml logs -f'"
    Write-Host "  重启服务: ssh root@${SERVER_IP} 'docker compose -f /opt/my-awesome-blog/docker-compose.prod.yml restart'"
    Write-Host "  停止服务: ssh root@${SERVER_IP} 'docker compose -f /opt/my-awesome-blog/docker-compose.prod.yml down'"
} else {
    Write-Host "部署失败，请检查错误信息" -ForegroundColor Red
}
