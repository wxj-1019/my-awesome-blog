"""测试数据库迁移"""
import os
import sys

# 切换到backend目录
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)

print(f"Current directory: {os.getcwd()}")
print(f"Alembic.ini exists: {os.path.exists('alembic.ini')}")

try:
    from app.utils.alembic_runner import AlembicRunner

    print("\n=== Step 1: Check current version ===")
    runner = AlembicRunner()
    success, stdout, stderr = runner.current()
    print(stdout if stdout else "[No current version]")
    if stderr:
        print("[INFO]", stderr.strip())

    print("\n=== Step 2: Upgrade to latest ===")
    success, stdout, stderr = runner.upgrade("head")
    print(stdout if stdout else "[Upgrade completed]")
    if stderr:
        print("[INFO]", stderr.strip())

    if not success:
        raise Exception(f"Migration failed")

    print("\n=== Step 3: Verify version ===")
    success, stdout, stderr = runner.current()
    print(stdout if stdout else "[No current version]")
    if stderr:
        print("[INFO]", stderr.strip())

    print("\n[OK] Migration completed successfully!")

except Exception as e:
    print(f"\n[ERROR] Migration failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
