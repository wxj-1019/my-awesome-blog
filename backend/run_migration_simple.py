"""
数据库迁移脚本 - 简化版
使用绝对路径避免目录冲突
"""

import os
import sys
import subprocess

# Fix Windows console encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def main():
    """使用 subprocess 调用 alembic 命令"""

    backend_dir = os.path.dirname(os.path.abspath(__file__))
    alembic_ini = os.path.join(backend_dir, 'alembic.ini')

    print("=" * 60)
    print("Database Migration Script")
    print("=" * 60)
    print(f"Working directory: {backend_dir}")
    print(f"Config file: {alembic_ini}")
    print()

    try:
        # Find alembic.exe
        alembic_exe = os.path.join(os.path.dirname(sys.executable), 'Scripts', 'alembic.exe')
        if not os.path.exists(alembic_exe):
            # Try PATH
            for path in os.environ.get('PATH', '').split(os.pathsep):
                candidate = os.path.join(path, 'alembic.exe')
                if os.path.exists(candidate):
                    alembic_exe = candidate
                    break

        if not os.path.exists(alembic_exe):
            raise FileNotFoundError("Cannot find alembic.exe")

        print(f"Using alembic: {alembic_exe}\n")

        # Step 1: Check current version
        print("[Step 1] Checking current database version...")
        result = subprocess.run(
            [alembic_exe, '-c', alembic_ini, 'current'],
            cwd=backend_dir,
            capture_output=True,
            text=True,
            check=False
        )
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)

        # Step 2: Upgrade to head
        print("[Step 2] Upgrading database to latest version...")
        result = subprocess.run(
            [alembic_exe, '-c', alembic_ini, 'upgrade', 'head'],
            cwd=backend_dir,
            capture_output=True,
            text=True,
            check=False
        )
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)

        # Step 3: Verify migration
        print("[Step 3] Verifying migration...")
        result = subprocess.run(
            [alembic_exe, '-c', alembic_ini, 'current'],
            cwd=backend_dir,
            capture_output=True,
            text=True,
            check=False
        )
        print(result.stdout)

        print("\n" + "=" * 60)
        print("✅ Database migration completed successfully!")
        print("=" * 60)
        return 0

    except Exception as e:
        print("\n" + "=" * 60)
        print("❌ Database migration failed!")
        print("=" * 60)
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
