# Migration Execution Script (PowerShell)

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration Execution Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置工作目录：脚本位于 backend/scripts/，需切到 backend/ 根（alembic.ini 所在处）
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $scriptPath "..")
Write-Host "Working directory: $PWD" -ForegroundColor Green
Write-Host ""

# Step 1: 检查数据库连接
Write-Host "[Step 1] Checking database connection..." -ForegroundColor Yellow
python scripts/check_db.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Database connection failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 2: 检查迁移状态
Write-Host ""
Write-Host "[Step 2] Checking migration status..." -ForegroundColor Yellow
python scripts/migration_status.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Migration status check failed, continuing..." -ForegroundColor Yellow
}

# Step 3: 执行迁移
Write-Host ""
Write-Host "[Step 3] Running migration..." -ForegroundColor Yellow
alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Migration failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 4: 验证迁移
Write-Host ""
Write-Host "[Step 4] Verifying migration..." -ForegroundColor Yellow
alembic current

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Migration completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to exit"
