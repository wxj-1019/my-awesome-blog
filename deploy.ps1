$ErrorActionPreference = "Stop"

Write-Host "=========================================="
Write-Host "  My Awesome Blog - 快速部署 (Windows)"
Write-Host "=========================================="

$SERVER_IP = $env:DEPLOY_SERVER_IP
if (-not $SERVER_IP) {
    Write-Host "错误: 请设置环境变量 DEPLOY_SERVER_IP" -ForegroundColor Red
    exit 1
}
$SERVER_USER = if ($env:DEPLOY_SERVER_USER) { $env:DEPLOY_SERVER_USER } else { "root" }
$DEPLOY_PATH = if ($env:DEPLOY_PATH) { $env:DEPLOY_PATH } else { "/opt/my-awesome-blog" }
$DEPLOY_TARGET = if ($env:DEPLOY_TARGET) { $env:DEPLOY_TARGET } else { "all" }
$FORCE_NO_CACHE = if ($env:FORCE_NO_CACHE) { $env:FORCE_NO_CACHE } else { "0" }
$SKIP_SYNC = if ($env:SKIP_SYNC) { $env:SKIP_SYNC } else { "0" }

Write-Host ""
Write-Host "步骤 1/4: 检查本地环境..."
$sshAvailable = Get-Command ssh -ErrorAction SilentlyContinue
if (-not $sshAvailable) {
    Write-Host "错误: 未找到 ssh 命令，请确保 OpenSSH 已安装" -ForegroundColor Red
    exit 1
}

Write-Host "步骤 2/4: 检查 .env.production..."
if (-not (Test-Path ".env.production")) {
    Write-Host "错误: .env.production 文件不存在" -ForegroundColor Red
    exit 1
}
$envContent = Get-Content ".env.production" -Raw
if ($envContent -match "CHANGE_THIS") {
    Write-Host "错误: .env.production 中包含未修改的占位符" -ForegroundColor Red
    exit 1
}

if ($SKIP_SYNC -ne "1") {
    Write-Host "步骤 3/4: 同步文件到服务器..."
    # 优先 WSL rsync；否则提示用 git archive / 手动
    $wsl = Get-Command wsl -ErrorAction SilentlyContinue
    if (-not $wsl) {
        Write-Host "未找到 wsl/rsync。请用 WSL 运行 deploy.sh，或设置 SKIP_SYNC=1 并在服务器更新代码。" -ForegroundColor Yellow
        Write-Host "示例: `$env:SKIP_SYNC=1; `$env:DEPLOY_SERVER_IP='$SERVER_IP'; .\deploy.ps1" -ForegroundColor Yellow
        exit 1
    }
    $exclude = @(
        "--exclude", "node_modules",
        "--exclude", ".next",
        "--exclude", "__pycache__",
        "--exclude", ".git",
        "--exclude", "*.pyc",
        "--exclude", ".env",
        "--exclude", ".env.local",
        "--exclude", ".env.production",
        "--exclude", "venv",
        "--exclude", ".venv",
        "--exclude", "logs",
        "--exclude", "*.log",
        "--exclude", ".trae",
        "--exclude", ".tmp-ssh-venv",
        "--exclude", ".tmp-*"
    ) -join " "
    $winPath = (Get-Location).Path -replace '\\', '/'
    $drive = $winPath.Substring(0, 1).ToLower()
    $wslPath = "/mnt/$drive" + $winPath.Substring(2)
    $rsyncCmd = "rsync -avz --progress $exclude `"$wslPath/`" ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/"
    Write-Host "WSL: $rsyncCmd"
    wsl bash -lc $rsyncCmd
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
    Write-Host "步骤 3/4: 跳过同步 (SKIP_SYNC=1)"
}

Write-Host "步骤 4/4: 服务器重建 ($DEPLOY_TARGET)..."
$noCacheArg = if ($FORCE_NO_CACHE -eq "1") { " --no-cache" } else { "" }
$remote = @"
set -e
cd $DEPLOY_PATH
export FORCE_NO_CACHE=$FORCE_NO_CACHE
if [ -x scripts/server-redeploy.sh ] || [ -f scripts/server-redeploy.sh ]; then
  bash scripts/server-redeploy.sh $DEPLOY_TARGET$noCacheArg
else
  export DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1
  docker compose -f docker-compose.prod.yml --env-file .env.production build$noCacheArg backend frontend
  docker compose -f docker-compose.prod.yml --env-file .env.production up -d
  docker compose -f docker-compose.prod.yml --env-file .env.production exec -T backend alembic upgrade head || true
fi
"@
# 单行传给 ssh，避免 Windows 换行问题
$remoteOneLine = ($remote -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ }) -join "; "
ssh "${SERVER_USER}@${SERVER_IP}" $remoteOneLine
if ($LASTEXITCODE -ne 0) {
    Write-Host "部署失败，请检查错误信息" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "=========================================="
Write-Host "  部署完成!"
Write-Host "=========================================="
Write-Host "  前端: http://${SERVER_IP}"
Write-Host "  API:  http://${SERVER_IP}/api/v1"
Write-Host "  Docs: http://${SERVER_IP}/docs"
Write-Host ""
Write-Host "加速提示:"
Write-Host "  只更前端: `$env:DEPLOY_TARGET='frontend'; .\deploy.ps1"
Write-Host "  只更后端: `$env:DEPLOY_TARGET='backend'; .\deploy.ps1"
Write-Host "  全量无缓存: `$env:FORCE_NO_CACHE='1'; .\deploy.ps1"
