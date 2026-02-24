"""测试数据库迁移"""
import os
import sys

# 切换到backend目录
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)

print(f"Current directory: {os.getcwd()}")
print(f"Alembic.ini exists: {os.path.exists('alembic.ini')}")

try:
    from alembic.config import Config
    from alembic import command

    print("\n=== Step 1: Check current version ===")
    alembic_cfg = Config("alembic.ini")
    command.current(alembic_cfg)

    print("\n=== Step 2: Upgrade to latest ===")
    command.upgrade(alembic_cfg, "head")

    print("\n=== Step 3: Verify version ===")
    command.current(alembic_cfg)

    print("\n[OK] Migration completed successfully!")

except Exception as e:
    print(f"\n[ERROR] Migration failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
