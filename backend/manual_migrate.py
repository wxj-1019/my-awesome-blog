import os
import sys
from app.utils.alembic_runner import AlembicRunner

# Fix Windows console encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def run_migration():
    try:
        print("开始执行数据库迁移...")

        # 配置 Alembic
        runner = AlembicRunner()

        # 执行迁移到最新版本
        print("升级到最新版本...")
        success, stdout, stderr = runner.upgrade("head")
        print(stdout if stdout else "[Upgrade completed]")
        if stderr:
            print("[INFO]", stderr.strip())

        if not success:
            raise Exception(f"Migration failed")

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
