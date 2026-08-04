@echo off
chcp 65001 >nul
cd /d %~dp0

echo ========================================
echo Migration Execution Script
echo ========================================
echo.
echo Working directory: %CD%
echo.

echo [Step 1] Checking database connection...
python check_db.py
if errorlevel 1 (
    echo [ERROR] Database connection failed
    pause
    exit /b 1
)

echo.
echo [Step 2] Checking migration status...
python migration_status.py
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
