@echo off
rem 脚本位于 backend/scripts/，工作目录切到 backend/ 根（alembic.ini 所在处）
cd /d %~dp0\..
echo Current directory: %CD%
echo.
echo Running database connection check...
python scripts\check_db.py
echo.
echo Running migration...
python scripts\test_migration.py
pause
