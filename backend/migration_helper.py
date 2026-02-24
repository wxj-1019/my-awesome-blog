"""
数据库迁移助手
提供常用的数据库迁移操作快捷命令
"""

from alembic.config import Config
from alembic import command
import sys


class MigrationHelper:
    """数据库迁移助手类"""

    def __init__(self):
        self.alembic_cfg = Config("alembic.ini")

    def current(self):
        """显示当前数据库版本"""
        print("Current database version:")
        command.current(self.alembic_cfg)

    def upgrade(self, revision="head"):
        """升级数据库

        Args:
            revision: 目标版本，默认为 "head"（最新版本）
        """
        print(f"Upgrading database to {revision}...")
        command.upgrade(self.alembic_cfg, revision)
        print("Upgrade completed successfully!")

    def downgrade(self, revision="-1"):
        """回滚数据库

        Args:
            revision: 目标版本，默认为 "-1"（上一个版本）
        """
        print(f"Downgrading database to {revision}...")
        command.downgrade(self.alembic_cfg, revision)
        print("Downgrade completed successfully!")

    def history(self):
        """显示迁移历史"""
        print("Migration history:")
        command.history(self.alembic_cfg)

    def show(self):
        """显示迁移状态"""
        print("Migration status:")
        command.show(self.alembic_cfg)

    def stamp(self, revision="head"):
        """标记数据库版本（不执行迁移）

        Args:
            revision: 要标记的版本，默认为 "head"
        """
        print(f"Stamping database as {revision}...")
        command.stamp(self.alembic_cfg, revision)
        print("Stamp completed!")


def main():
    """命令行接口"""
    if len(sys.argv) < 2:
        print("Usage: python migration_helper.py <command> [args]")
        print("\nCommands:")
        print("  current              - 显示当前版本")
        print("  upgrade [revision]   - 升级数据库 (默认: head)")
        print("  downgrade [revision] - 回滚数据库 (默认: -1)")
        print("  history              - 显示迁移历史")
        print("  show                 - 显示迁移状态")
        print("  stamp [revision]     - 标记版本 (默认: head)")
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
            helper.show()
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
