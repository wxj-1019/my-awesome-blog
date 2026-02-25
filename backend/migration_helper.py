"""
数据库迁移助手
提供常用的数据库迁移操作快捷命令
"""

from app.utils.alembic_runner import AlembicRunner
import sys


class MigrationHelper:
    """数据库迁移助手类"""

    def __init__(self):
        self.runner = AlembicRunner()

    def current(self):
        """显示当前数据库版本"""
        print("Current database version:")
        success, stdout, stderr = self.runner.current()
        print(stdout if stdout else "[No current version]")
        if stderr:
            print("[INFO]", stderr.strip())

    def upgrade(self, revision="head"):
        """升级数据库

        Args:
            revision: 目标版本，默认为 "head"（最新版本）
        """
        print(f"Upgrading database to {revision}...")
        success, stdout, stderr = self.runner.upgrade(revision)
        print(stdout if stdout else "[Upgrade completed]")
        if stderr:
            print("[INFO]", stderr.strip())

        if not success:
            raise Exception(f"Upgrade failed")

    def downgrade(self, revision="-1"):
        """回滚数据库

        Args:
            revision: 目标版本，默认为 "-1"（上一个版本）
        """
        print(f"Downgrading database to {revision}...")
        success, stdout, stderr = self.runner.downgrade(revision)
        print(stdout if stdout else "[Downgrade completed]")
        if stderr:
            print("[INFO]", stderr.strip())

        if not success:
            raise Exception(f"Downgrade failed")

    def history(self):
        """显示迁移历史"""
        print("Migration history:")
        success, stdout, stderr = self.runner.history()
        print(stdout if stdout else "[No migration history]")
        if stderr:
            print("[INFO]", stderr.strip())

    def show(self, revision=None):
        """显示迁移状态

        Args:
            revision: 要显示的版本，如果为 None 则显示所有
        """
        if revision:
            print(f"Migration status for {revision}:")
            success, stdout, stderr = self.runner.show(revision)
            print(stdout if stdout else "[No information available]")
            if stderr:
                print("[INFO]", stderr.strip())
        else:
            print("Migration status:")
            print("Run 'show <revision>' to see details of a specific revision")

    def stamp(self, revision="head"):
        """标记数据库版本（不执行迁移）

        Args:
            revision: 要标记的版本，默认为 "head"
        """
        print(f"Stamping database as {revision}...")
        success, stdout, stderr = self.runner.stamp(revision)
        print(stdout if stdout else "[Stamp completed]")
        if stderr:
            print("[INFO]", stderr.strip())

        if not success:
            raise Exception(f"Stamp failed")


def main():
    """命令行接口"""
    if len(sys.argv) < 2:
        print("Usage: python migration_helper.py <command> [args]")
        print("\nCommands:")
        print("  current              - 显示当前版本")
        print("  upgrade [revision]   - 升级数据库 (默认: head)")
        print("  downgrade [revision] - 回滚数据库 (默认: -1)")
        print("  history              - 显示迁移历史")
        print("  show [revision]      - 显示迁移状态")
        print("  stamp [revision]      - 标记版本 (默认: head)")
        print("\nExamples:")
        print("  python migration_helper.py current")
        print("  python migration_helper.py upgrade")
        print("  python migration_helper.py downgrade")
        print("  python migration_helper.py stamp 011")
        return 1

    helper = MigrationHelper()
    cmd = sys.argv[1].lower()
    args = sys.argv[2:]

    try:
        if cmd == "current":
            helper.current()
        elif cmd == "upgrade":
            revision = args[0] if args else "head"
            helper.upgrade(revision)
        elif cmd == "downgrade":
            revision = args[0] if args else "-1"
            helper.downgrade(revision)
        elif cmd == "history":
            helper.history()
        elif cmd == "show":
            revision = args[0] if args else None
            helper.show(revision)
        elif cmd == "stamp":
            revision = args[0] if args else "head"
            helper.stamp(revision)
        else:
            print(f"Unknown command: {cmd}")
            return 1

        return 0

    except Exception as e:
        print(f"Error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
