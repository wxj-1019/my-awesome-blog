@echo off
chcp 65001 >nul
rem 脚本位于 backend/scripts/，工作目录切到 backend/ 根（alembic.ini 所在处）
cd /d %~dp0\..

echo ========================================
echo Migration Execution Script
echo ========================================
echo.
echo Working directory: %CD%
echo.

echo [Step 1] Checking database connection...
python scripts\check_db.py
if errorlevel 1 (
    echo [ERROR] Database connection failed
    pause
    exit /b 1
)

echo.
echo [Step 2] Checking migration status...
python scripts\migration_status.py
if errorlevel 1 (
    echo [WARNING] Migration status check failed, continuing...
)

echo.
echo [Step 3] Running migration...
alembic upgrade head
if errorlevel 1 (
    echo [ERROR] Migration failed
    pause
    exit /b 1
)

echo.
echo [Step 4] Verifying migration...
alembic current

echo.
echo ========================================
echo [SUCCESS] Migration completed!
echo ========================================
echo.
pause
