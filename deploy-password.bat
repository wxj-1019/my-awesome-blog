@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ==========================================
echo   My Awesome Blog - 部署脚本
echo ==========================================
echo.

set SERVER_IP=49.234.190.85
set SERVER_USER=root
set DEPLOY_PATH=/opt/my-awesome-blog
set PASSWORD=zenjiroqQ+

echo 步骤 1/5: 测试 SSH 连接...
echo y | plink -ssh %SERVER_USER%@%SERVER_IP% -pw %PASSWORD% "echo SSH连接成功" 2>nul
if errorlevel 1 (
    echo 正在尝试使用原生 SSH...
    ssh -o StrictHostKeyChecking=no -o BatchMode=no %SERVER_USER%@%SERVER_IP% "echo OK"
)

echo.
echo 步骤 2/5: 创建远程目录...
echo y | plink -ssh %SERVER_USER%@%SERVER_IP% -pw %PASSWORD% "mkdir -p %DEPLOY_PATH%/nginx" 2>nul
if errorlevel 1 (
    ssh %SERVER_USER%@%SERVER_IP% "mkdir -p %DEPLOY_PATH%/nginx"
)

echo.
echo 步骤 3/5: 上传配置文件...
cd /d E:\A_Project\my-awesome-blog

echo   上传 docker-compose.prod.yml...
pscp -pw %PASSWORD% docker-compose.prod.yml %SERVER_USER%@%SERVER_IP%:%DEPLOY_PATH%/ 2>nul
if errorlevel 1 (
    scp docker-compose.prod.yml %SERVER_USER%@%SERVER_IP%:%DEPLOY_PATH%/
)

echo   上传 .env.production...
pscp -pw %PASSWORD% .env.production %SERVER_USER%@%SERVER_IP%:%DEPLOY_PATH%/ 2>nul
if errorlevel 1 (
    scp .env.production %SERVER_USER%@%SERVER_IP%:%DEPLOY_PATH%/
)

echo   上传 nginx 配置...
pscp -pw %PASSWORD% nginx\nginx.conf %SERVER_USER%@%SERVER_IP%:%DEPLOY_PATH%/nginx/ 2>nul
if errorlevel 1 (
    scp nginx\nginx.conf %SERVER_USER%@%SERVER_IP%:%DEPLOY_PATH%/nginx/
)

echo   上传 backend 目录...
pscp -pw %PASSWORD% -r backend %SERVER_USER%@%SERVER_IP%:%DEPLOY_PATH%/ 2>nul
if errorlevel 1 (
    scp -r backend %SERVER_USER%@%SERVER_IP%:%DEPLOY_PATH%/
)

echo   上传 frontend 目录...
pscp -pw %PASSWORD% -r frontend %SERVER_USER%@%SERVER_IP%:%DEPLOY_PATH%/ 2>nul
if errorlevel 1 (
    scp -r frontend %SERVER_USER%@%SERVER_IP%:%DEPLOY_PATH%/
)

echo.
echo 步骤 4/5: 构建并启动服务...
echo y | plink -ssh %SERVER_USER%@%SERVER_IP% -pw %PASSWORD% "cd %DEPLOY_PATH% && cp .env.production .env && docker compose -f docker-compose.prod.yml build --no-cache && docker compose -f docker-compose.prod.yml up -d" 2>nul
if errorlevel 1 (
    ssh %SERVER_USER%@%SERVER_IP% "cd %DEPLOY_PATH% && cp .env.production .env && docker compose -f docker-compose.prod.yml build --no-cache && docker compose -f docker-compose.prod.yml up -d"
)

echo.
echo 步骤 5/5: 等待服务启动并检查状态...
timeout /t 15 /nobreak >nul

echo y | plink -ssh %SERVER_USER%@%SERVER_IP% -pw %PASSWORD% "docker compose -f %DEPLOY_PATH%/docker-compose.prod.yml ps" 2>nul
if errorlevel 1 (
    ssh %SERVER_USER%@%SERVER_IP% "docker compose -f %DEPLOY_PATH%/docker-compose.prod.yml ps"
)

echo.
echo ==========================================
echo   部署完成!
echo ==========================================
echo.
echo 访问地址:
echo   前端: http://%SERVER_IP%
echo   API 文档: http://%SERVER_IP%/docs
echo.
pause
