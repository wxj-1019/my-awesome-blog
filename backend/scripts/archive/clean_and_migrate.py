import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

def clean_and_migrate():
    engine = create_engine(settings.DATABASE_URL)

    try:
        with engine.begin() as connection:
            print("开始清理和迁移...\n")

            # 清理 typewriter_contents 表的可能残留
            print("1. 检查并清理 typewriter_contents 表...")
            try:
                connection.execute(text("ALTER TABLE typewriter_contents DROP COLUMN IF EXISTS id_new"))
                print("   已清理 id_new 列")
            except:
                pass

            # 清理 weather 表的可能残留
            print("2. 检查并清理 weather 表...")
            try:
                connection.execute(text("ALTER TABLE weather DROP COLUMN IF EXISTS id_new"))
                print("   已清理 id_new 列")
            except:
                pass

            # 迁移 typewriter_contents 表
            print("\n3. 迁移 typewriter_contents 表...")
            connection.execute(text("ALTER TABLE typewriter_contents ADD COLUMN id_new UUID"))
            connection.execute(text("UPDATE typewriter_contents SET id_new = gen_random_uuid()"))
            connection.execute(text("ALTER TABLE typewriter_contents DROP CONSTRAINT typewriter_contents_pkey CASCADE"))
            connection.execute(text("ALTER TABLE typewriter_contents ALTER COLUMN id_new SET NOT NULL"))
            connection.execute(text("ALTER TABLE typewriter_contents ADD CONSTRAINT typewriter_contents_pkey PRIMARY KEY (id_new)"))
            connection.execute(text("ALTER TABLE typewriter_contents DROP COLUMN id"))
            connection.execute(text("ALTER TABLE typewriter_contents RENAME COLUMN id_new TO id"))
            print("   [OK] typewriter_contents migration completed")

            # 迁移 weather 表
            print("\n4. Migrating weather table...")
            connection.execute(text("ALTER TABLE weather ADD COLUMN id_new UUID"))
            connection.execute(text("UPDATE weather SET id_new = gen_random_uuid()"))
            connection.execute(text("ALTER TABLE weather DROP CONSTRAINT weather_pkey CASCADE"))
            connection.execute(text("ALTER TABLE weather ALTER COLUMN id_new SET NOT NULL"))
            connection.execute(text("ALTER TABLE weather ADD CONSTRAINT weather_pkey PRIMARY KEY (id_new)"))
            connection.execute(text("ALTER TABLE weather DROP COLUMN id"))
            connection.execute(text("ALTER TABLE weather RENAME COLUMN id_new TO id"))
            print("   [OK] weather migration completed")

            # 更新 alembic 版本
            print("\n5. Updating alembic version...")
            connection.execute(text("UPDATE alembic_version SET version_num = '011'"))
            print("   [OK] Version updated")

            print("\n[SUCCESS] All migrations completed successfully!")

        return True
    except Exception as e:
        print(f"\n[ERROR] Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        engine.dispose()

if __name__ == '__main__':
    success = clean_and_migrate()
    sys.exit(0 if success else 1)
