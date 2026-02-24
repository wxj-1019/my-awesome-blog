"""
数据库迁移脚本
用于手动执行数据库迁移
"""

import sys
from app.utils.alembic_runner import AlembicRunner

# Fix Windows console encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')


def main():
    """执行数据库迁移到最新版本"""
    print("=" * 60)
    print("Database Migration Script")
    print("=" * 60)

    try:
        runner = AlembicRunner()

        # 显示当前版本
        print("\n[Step 1] Checking current database version...")
        success, stdout, stderr = runner.current()
        print(stdout if stdout else "[No current version]")
        if stderr:
            print("[INFO]", stderr.strip())

        # 升级到最新版本
        print("\n[Step 2] Upgrading database to latest version...")
        success, stdout, stderr = runner.upgrade("head")
        print(stdout if stdout else "[Upgrade completed]")
        if stderr:
            print("[INFO]", stderr.strip())

        if not success:
            raise Exception(f"Migration failed")

        print("\n[Step 3] Verifying migration...")
        success, stdout, stderr = runner.current()
        print(stdout if stdout else "[No current version]")
        if stderr:
            print("[INFO]", stderr.strip())

        print("\n" + "=" * 60)
        print("✅ Database migration completed successfully!")
        print("=" * 60)
        return 0

    except Exception as e:
        print("\n" + "=" * 60)
        print("❌ Database migration failed!")
        print("=" * 60)
        print(f"\nError: {e}")
        print("\nTroubleshooting:")
        print("1. Check if PostgreSQL is running")
        print("2. Verify DATABASE_URL in .env file")
        print("3. Ensure you have necessary permissions")
        print("4. Check if alembic.ini is properly configured")
        return 1


if __name__ == "__main__":
    sys.exit(main())
