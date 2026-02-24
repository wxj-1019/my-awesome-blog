import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from alembic.config import Config
from alembic import command

def run_migration():
    try:
        print("开始执行数据库迁移...")

        # 配置 Alembic
        alembic_cfg = Config("alembic.ini")

        # 执行迁移到最新版本
        print("升级到最新版本...")
        command.upgrade(alembic_cfg, "head")

        print("\n✅ 数据库迁移成功完成！")
        return True
    except Exception as e:
        print(f"\n❌ 数据库迁移失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)
