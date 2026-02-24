"""
迁移状态检查脚本
"""
import os
import sys

# 设置工作目录
os.chdir(os.path.dirname(os.path.abspath(__file__)))

def check_database():
    """检查数据库连接"""
    print("=" * 60)
    print("Database Connection Check")
    print("=" * 60)

    try:
        from dotenv import load_dotenv
        load_dotenv()

        import psycopg2
        from sqlalchemy import create_engine, text

        db_url = os.getenv('DATABASE_URL')
        print(f"\nDatabase URL: {db_url[:30]}..." if db_url else "Database URL: NOT CONFIGURED")

        if not db_url:
            print("[ERROR] DATABASE_URL not found in .env file")
            return False

        # 测试连接
        print("\n[TEST] Connecting to database...")
        engine = create_engine(db_url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print(f"[OK] Database connected")
            print(f"      PostgreSQL version: {version.split()[1]}")

        return True

    except Exception as e:
        print(f"[ERROR] {e}")
        return False


def check_migration():
    """检查迁移状态"""
    print("\n" + "=" * 60)
    print("Migration Status Check")
    print("=" * 60)

    try:
        from alembic.config import Config
        from alembic import command

        print("\n[TEST] Checking Alembic configuration...")
        cfg = Config("alembic.ini")
        print("[OK] Alembic config loaded")

        print("\n[INFO] Current database version:")
        command.current(cfg)

        print("\n[INFO] Latest available version:")
        command.history(cfg)

        return True

    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """主函数"""
    print("\nMigration Test Tool")
    print("==================\n")

    # 检查数据库
    db_ok = check_database()

    # 检查迁移
    migration_ok = check_migration()

    # 总结
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"Database:   {'OK' if db_ok else 'FAILED'}")
    print(f"Migration:  {'OK' if migration_ok else 'FAILED'}")

    if db_ok and migration_ok:
        print("\nAll checks passed! You can run migration now.")
        print("Command: alembic upgrade head")
        return 0
    else:
        print("\nSome checks failed. Please fix the issues above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
