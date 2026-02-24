"""
Alembic 运行器工具类

通过 subprocess 调用 alembic.exe 命令行工具，避免与 backend/alembic 目录的命名冲突。
"""

import os
import sys
import subprocess
import json
from typing import Optional, Tuple
from pathlib import Path


class AlembicRunner:
    """Alembic 命令行工具的封装类"""

    def __init__(self, config_path: Optional[str] = None):
        """
        初始化 AlembicRunner

        Args:
            config_path: alembic.ini 配置文件的路径。如果为 None，则自动查找 backend/alembic.ini
        """
        if config_path is None:
            # 自动查找配置文件
            current_dir = Path(__file__).parent.parent.parent
            self.config_path = str(current_dir / "alembic.ini")
        else:
            self.config_path = os.path.abspath(config_path)

        # 验证配置文件存在
        if not os.path.exists(self.config_path):
            raise FileNotFoundError(f"Alembic config file not found: {self.config_path}")

        # 查找 alembic.exe
        self.alembic_exe = self._find_alembic_exe()

    def _find_alembic_exe(self) -> str:
        """查找 alembic.exe 可执行文件"""
        # 方法1: 在 Python Scripts 目录中查找
        scripts_dir = Path(sys.executable).parent / "Scripts"
        candidate = scripts_dir / "alembic.exe"
        if candidate.exists():
            return str(candidate)

        # 方法2: 在 PATH 中查找
        for path in os.environ.get('PATH', '').split(os.pathsep):
            candidate = Path(path) / "alembic.exe"
            if candidate.exists():
                return str(candidate)

        raise FileNotFoundError(
            "Cannot find alembic.exe. Please ensure Alembic is installed and accessible in PATH."
        )

    def _run_command(
        self,
        *args: str,
        capture_output: bool = True,
        check: bool = False
    ) -> subprocess.CompletedProcess:
        """
        运行 alembic 命令

        Args:
            *args: 命令参数
            capture_output: 是否捕获输出
            check: 是否在非零退出码时抛出异常

        Returns:
            subprocess.CompletedProcess 对象
        """
        cmd = [self.alembic_exe, "-c", self.config_path] + list(args)

        result = subprocess.run(
            cmd,
            capture_output=capture_output,
            text=True,
            check=check,
            cwd=os.path.dirname(self.config_path)
        )

        return result

    def current(self) -> Tuple[bool, str, str]:
        """
        显示当前数据库版本

        Returns:
            (success, stdout, stderr)
        """
        result = self._run_command("current")
        return (result.returncode == 0, result.stdout, result.stderr)

    def upgrade(self, revision: str = "head") -> Tuple[bool, str, str]:
        """
        升级数据库到指定版本

        Args:
            revision: 目标版本，默认为 "head"

        Returns:
            (success, stdout, stderr)
        """
        result = self._run_command("upgrade", revision)
        return (result.returncode == 0, result.stdout, result.stderr)

    def downgrade(self, revision: str = "-1") -> Tuple[bool, str, str]:
        """
        回滚数据库到指定版本

        Args:
            revision: 目标版本，默认为 "-1"（上一个版本）

        Returns:
            (success, stdout, stderr)
        """
        result = self._run_command("downgrade", revision)
        return (result.returncode == 0, result.stdout, result.stderr)

    def history(self, verbose: bool = False) -> Tuple[bool, str, str]:
        """
        显示迁移历史

        Args:
            verbose: 是否显示详细信息

        Returns:
            (success, stdout, stderr)
        """
        args = ["history", "-v"] if verbose else ["history"]
        result = self._run_command(*args)
        return (result.returncode == 0, result.stdout, result.stderr)

    def show(self, revision: str) -> Tuple[bool, str, str]:
        """
        显示指定版本的详细信息

        Args:
            revision: 版本号

        Returns:
            (success, stdout, stderr)
        """
        result = self._run_command("show", revision)
        return (result.returncode == 0, result.stdout, result.stderr)

    def stamp(self, revision: str) -> Tuple[bool, str, str]:
        """
        标记数据库版本（不执行实际的 SQL 迁移）

        Args:
            revision: 版本号

        Returns:
            (success, stdout, stderr)
        """
        result = self._run_command("stamp", revision)
        return (result.returncode == 0, result.stdout, result.stderr)

    def revision(
        self,
        message: str,
        autogenerate: bool = False,
        head: bool = True
    ) -> Tuple[bool, str, str]:
        """
        创建新的迁移文件

        Args:
            message: 迁移说明
            autogenerate: 是否自动生成迁移
            head: 是否基于最新版本

        Returns:
            (success, stdout, stderr)
        """
        args = ["revision", "-m", message]
        if autogenerate:
            args.append("--autogenerate")
        if head:
            args.append("--head")
        result = self._run_command(*args)
        return (result.returncode == 0, result.stdout, result.stderr)

    def heads(self) -> Tuple[bool, str, str]:
        """
        显示所有最新版本

        Returns:
            (success, stdout, stderr)
        """
        result = self._run_command("heads")
        return (result.returncode == 0, result.stdout, result.stderr)

    def branches(self) -> Tuple[bool, str, str]:
        """
        显示所有分支

        Returns:
            (success, stdout, stderr)
        """
        result = self._run_command("branches")
        return (result.returncode == 0, result.stdout, result.stderr)


# 便捷函数
def get_alembic_runner(config_path: Optional[str] = None) -> AlembicRunner:
    """
    获取 AlembicRunner 实例的便捷函数

    Args:
        config_path: alembic.ini 配置文件的路径

    Returns:
        AlembicRunner 实例
    """
    return AlembicRunner(config_path)


def run_migration(revision: str = "head") -> bool:
    """
    执行数据库迁移的便捷函数

    Args:
        revision: 目标版本，默认为 "head"

    Returns:
        是否成功
    """
    runner = get_alembic_runner()
    success, stdout, stderr = runner.upgrade(revision)
    return success
