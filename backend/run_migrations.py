"""
数据库迁移脚本
用于手动执行数据库迁移
"""

import sys
from alembic.config import Config
from alembic import command


def main():
    """执行数据库迁移到最新版本"""
    print("=" * 60)
    print("Database Migration Script")
    print("=" * 60)

    try:
        # 配置 Alembic
        alembic_cfg = Config("alembic.ini")

        # 显示当前版本
        print("\n[Step 1] Checking current database version...")
        command.current(alembic_cfg)

        # 升级到最新版本
        print("\n[Step 2] Upgrading database to latest version...")
        command.upgrade(alembic_cfg, "head")

        print("\n[Step 3] Verifying migration...")
        command.current(alembic_cfg)

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
