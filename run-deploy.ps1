Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  My Awesome Blog - 部署脚本" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$SERVER_IP = "49.234.190.85"
$SERVER_USER = "root"
$DEPLOY_PATH = "/opt/my-awesome-blog"

Write-Host ""
Write-Host "步骤 1/5: 测试 SSH 连接..." -ForegroundColor Yellow

$connected = $false
try {
    $result = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "echo OK"
    if ($result -eq "OK") {
        $connected = $true
        Write-Host "SSH 连接成功!" -ForegroundColor Green
    }
} catch {
    Write-Host "SSH 连接失败: $_" -ForegroundColor Red
}

if (-not $connected) {
    Write-Host "请确保可以手动执行: ssh root@49.234.190.85" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "步骤 2/5: 创建远程目录..." -ForegroundColor Yellow
ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $DEPLOY_PATH/nginx"
Write-Host "目录创建完成!" -ForegroundColor Green

Write-Host ""
Write-Host "步骤 3/5: 上传配置文件..." -ForegroundColor Yellow

Set-Location "E:\A_Project\my-awesome-blog"

Write-Host "  上传 docker-compose.prod.yml..."
scp docker-compose.prod.yml "$SERVER_USER@$SERVER_IP`:$DEPLOY_PATH/"

Write-Host "  上传 .env.production..."
scp .env.production "$SERVER_USER@$SERVER_IP`:$DEPLOY_PATH/"

Write-Host "  上传 nginx 配置..."
scp nginx\nginx.conf "$SERVER_USER@$SERVER_IP`:$DEPLOY_PATH/nginx/"

Write-Host "  上传 backend..."
scp -r backend "$SERVER_USER@$SERVER_IP`:$DEPLOY_PATH/" 2>$null

Write-Host "  上传 frontend..."
scp -r frontend "$SERVER_USER@$SERVER_IP`:$DEPLOY_PATH/" 2>$null

Write-Host "配置文件上传完成!" -ForegroundColor Green

Write-Host ""
Write-Host "步骤 4/5: 构建并启动服务..." -ForegroundColor Yellow

$buildCmd = "cd $DEPLOY_PATH && " +
    "cp .env.production .env && " +
    "docker compose -f docker-compose.prod.yml build --no-cache && " +
    "docker compose -f docker-compose.prod.yml up -d"

ssh "$SERVER_USER@$SERVER_IP" $buildCmd

Write-Host ""
Write-Host "步骤 5/5: 等待服务启动并检查状态..." -ForegroundColor Yellow

Start-Sleep -Seconds 15

ssh "$SERVER_USER@$SERVER_IP" "docker compose -f $DEPLOY_PATH/docker-compose.prod.yml ps"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  部署完成!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "访问地址:" -ForegroundColor Cyan
Write-Host "  前端: http://$SERVER_IP"
Write-Host "  API 文档: http://$SERVER_IP/docs"
Write-Host ""
