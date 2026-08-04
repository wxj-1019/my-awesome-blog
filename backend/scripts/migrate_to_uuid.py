import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

def run_migration_sql():
    engine = create_engine(settings.DATABASE_URL)

    try:
        with engine.begin() as connection:
            print("开始执行 UUID 迁移...\n")

            # 迁移 typewriter_contents 表
            print("1. 迁移 typewriter_contents 表...")
            connection.execute(text("ALTER TABLE typewriter_contents ADD COLUMN id_new UUID"))
            connection.execute(text("UPDATE typewriter_contents SET id_new = gen_random_uuid()"))
            connection.execute(text("ALTER TABLE typewriter_contents DROP CONSTRAINT typewriter_contents_pkey"))
            connection.execute(text("ALTER TABLE typewriter_contents ALTER COLUMN id_new SET NOT NULL"))
            connection.execute(text("ALTER TABLE typewriter_contents ADD CONSTRAINT typewriter_contents_pkey PRIMARY KEY (id_new)"))
            connection.execute(text("ALTER TABLE typewriter_contents RENAME COLUMN id_new TO id"))
            print("   ✅ typewriter_contents 迁移完成")

            # 迁移 weather 表
            print("\n2. 迁移 weather 表...")
            connection.execute(text("ALTER TABLE weather ADD COLUMN id_new UUID"))
            connection.execute(text("UPDATE weather SET id_new = gen_random_uuid()"))
            connection.execute(text("ALTER TABLE weather DROP CONSTRAINT weather_pkey"))
            connection.execute(text("ALTER TABLE weather ALTER COLUMN id_new SET NOT NULL"))
            connection.execute(text("ALTER TABLE weather ADD CONSTRAINT weather_pkey PRIMARY KEY (id_new)"))
            connection.execute(text("ALTER TABLE weather RENAME COLUMN id_new TO id"))
            print("   ✅ weather 迁移完成")

            # 更新 alembic 版本
            print("\n3. 更新 alembic 版本...")
            connection.execute(text("UPDATE alembic_version SET version_num = '011'"))
            print("   ✅ 版本更新完成")

            print("\n✅ 所有迁移成功完成！")

        return True
    except Exception as e:
        print(f"\n❌ 迁移失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        engine.dispose()

if __name__ == '__main__':
    success = run_migration_sql()
    sys.exit(0 if success else 1)
