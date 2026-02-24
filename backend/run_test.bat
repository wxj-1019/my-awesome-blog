@echo off
cd /d %~dp0
echo Current directory: %CD%
echo.
echo Running database connection check...
python check_db.py
echo.
echo Running migration...
python test_migration.py
pause
