#!/usr/bin/env python3
"""部署脚本：将 My Awesome Blog 快速部署到服务器（tar 压缩传输 + Docker 缓存构建）"""

import os
import sys
import time
import io
import tarfile
import fnmatch
from paramiko import SSHClient, AutoAddPolicy
from pathlib import Path

# 服务器配置
SERVER_IP = "192.168.100.12"
SERVER_USER = "root"
SERVER_PASSWORD = "rongqizhizao1.!"
DEPLOY_PATH = "/opt/my-awesome-blog"

# 项目根目录
PROJECT_ROOT = Path(__file__).parent

# 需要上传的文件/目录
UPLOAD_ITEMS = [
    "docker-compose.prod.yml",
    ".env.production",
    "nginx",
    "backend",
    "frontend",
]

# 需要排除的目录/文件（大幅减少传输体积）
EXCLUDE_PATTERNS = [
    "node_modules",
    ".next",
    "__pycache__",
    ".git",
    "*.pyc",
    ".env",
    ".env.local",
    "venv",
    ".venv",
    "logs",
    "*.log",
    ".trae",
    ".qoder",
    ".codebuddy",
    ".qwen",
    ".idea",
    "my_awesome_blog.db",
    "*.db",
    ".pytest_cache",
    "*.egg-info",
    ".husky",
    "design-system",
    "echo",
    "cleanup",
    "seed",
    "tests",
]


def create_ssh_client():
    """创建 SSH 客户端"""
    client = SSHClient()
    client.set_missing_host_key_policy(AutoAddPolicy())
    return client


def run_ssh(client, cmd, timeout=300):
    """执行远程命令"""
    print(f"  [CMD] {cmd[:120]}{'...' if len(cmd) > 120 else ''}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=True)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out.strip():
        # 截断过长输出
        lines = out.strip().split("\n")
        if len(lines) > 10:
            print("  [OUT] " + "\n         ".join(lines[:5]))
            print(f"         ... (省略 {len(lines)-10} 行)")
            print("         " + "\n         ".join(lines[-5:]))
        else:
            print("  [OUT] " + "\n         ".join(lines))
    if exit_code != 0 and err.strip():
        print(f"  [ERR] {err.strip()[:300]}")
    return exit_code, out, err


def _should_exclude(name, excludes):
    for pat in excludes:
        if fnmatch.fnmatch(name, pat):
            return True
    return False


def _add_to_tar(tar, local_path, excludes):
    """递归添加文件到 tar，跳过排除项"""
    name = os.path.basename(str(local_path))
    if _should_exclude(name, excludes):
        return

    if local_path.is_file():
        rel = str(local_path.relative_to(PROJECT_ROOT))
        tar.add(str(local_path), arcname=rel)
    elif local_path.is_dir():
        for root, dirs, files in os.walk(str(local_path)):
            # 过滤排除的目录
            dirs[:] = [d for d in dirs if not _should_exclude(d, excludes)]
            for f in files:
                if _should_exclude(f, excludes):
                    continue
                fp = Path(root) / f
                rel = str(fp.relative_to(PROJECT_ROOT))
                tar.add(str(fp), arcname=rel)


def step1_check_env(client):
    """检查服务器环境"""
    print("\n" + "=" * 50)
    print("  Task 1: 检查服务器环境")
    print("=" * 50)

    try:
        client.connect(
            SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD,
            timeout=10, look_for_keys=False, allow_agent=False,
        )
        print(f"  SSH 连接成功: {SERVER_USER}@{SERVER_IP}")
    except Exception as e:
        print(f"  SSH 连接失败: {e}")
        return False

    ec, out, _ = run_ssh(client, "docker --version")
    if ec != 0:
        print("  错误: 服务器未安装 Docker，请先安装")
        return False
    print(f"  Docker: {out.strip()}")

    ec, out, _ = run_ssh(client, "docker compose version 2>/dev/null || docker-compose --version")
    if ec != 0:
        print("  错误: 服务器未安装 Docker Compose")
        return False
    print(f"  Docker Compose: {out.strip()}")

    ec, out, _ = run_ssh(client, "free -h | grep Mem")
    print(f"  内存: {out.strip()}")

    return True


def step2_upload(client):
    """上传文件 - tar.gz 压缩单文件传输"""
    print("\n" + "=" * 50)
    print("  Task 2: 打包并上传项目文件")
    print("=" * 50)

    # 服务器端准备
    run_ssh(client, f"rm -rf {DEPLOY_PATH} && mkdir -p {DEPLOY_PATH}")

    # 本地打包
    print("  [本地] 正在打包项目文件（排除 node_modules/.venv/logs 等）...")
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        for item in UPLOAD_ITEMS:
            lp = PROJECT_ROOT / item
            if not lp.exists():
                print(f"  跳过: {item}")
                continue
            print(f"  打包: {item}")
            _add_to_tar(tar, lp, EXCLUDE_PATTERNS)

    size_mb = buf.tell() / (1024 * 1024)
    print(f"  打包完成: {size_mb:.1f} MB")

    # SFTP 上传单个文件
    print("  [上传] 正在传输到服务器...")
    buf.seek(0)
    sftp = client.open_sftp()
    try:
        sftp.putfo(buf, f"{DEPLOY_PATH}/deploy.tar.gz",
                   callback=lambda done, total: print(f"\r    进度: {done*100//total}%", end="", flush=True) if total > 0 else None)
        print()  # newline after progress
    finally:
        sftp.close()

    # 解压
    print("  [解压] 正在解压文件...")
    ec, out, err = run_ssh(client,
        f"cd {DEPLOY_PATH} && tar xzf deploy.tar.gz && rm deploy.tar.gz && cp .env.production .env && echo 'OK'",
        timeout=120)
    if ec != 0:
        print(f"  解压失败: {err}")
        return False

    print("  上传完成!")
    return True


def step3_build(client):
    """构建 Docker 镜像（--network=host 解决容器内代理不可达）"""
    print("\n" + "=" * 50)
    print("  Task 3: 构建 Docker 镜像")
    print("=" * 50)

    # 使用 --network host 构建，让容器能访问宿主机 127.0.0.1:7890 代理
    print("  构建 backend（--network host）...")
    cmd = f"cd {DEPLOY_PATH} && docker build --network host -t my-awesome-blog-backend ./backend 2>&1"
    ec, out, err = run_ssh(client, cmd, timeout=1800)
    if ec != 0:
        print(f"  backend 构建失败! 退出码: {ec}")
        return False

    cmd = f"cd {DEPLOY_PATH} && docker build --network host -t my-awesome-blog-frontend ./frontend 2>&1"
    print("  构建 frontend（--network host）...")
    ec, out, err = run_ssh(client, cmd, timeout=1800)
    if ec != 0:
        print(f"  frontend 构建失败! 退出码: {ec}")
        return False

    print("  构建完成!")
    return True


def step4_start(client):
    """启动服务"""
    print("\n" + "=" * 50)
    print("  Task 4: 启动服务")
    print("=" * 50)

    # 停止旧容器
    run_ssh(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true")

    # 启动
    ec, out, err = run_ssh(client,
        f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml up -d 2>&1",
        timeout=300)
    if ec != 0:
        print(f"  启动失败: {err}")
        return False

    print("  等待服务就绪 (20s)...")
    time.sleep(20)

    # 数据库迁移
    print("  执行数据库迁移...")
    run_ssh(client,
        f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head 2>&1 || echo 'Migration note: may already be up-to-date'",
        timeout=60)

    return True


def step5_verify(client):
    """验证部署"""
    print("\n" + "=" * 50)
    print("  Task 5: 验证部署")
    print("=" * 50)

    # 容器状态
    ec, out, _ = run_ssh(client,
        f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml ps")
    print(f"\n  容器状态:\n{out}")

    # 检查各服务
    time.sleep(5)

    # 后端
    ec, out, _ = run_ssh(client,
        "curl -s -o /dev/null -w '%{http_code}' http://localhost:8989/health")
    if "200" in out:
        print(f"  后端健康: 通过 (200)")
    else:
        print(f"  后端健康: {out.strip()}")

    # 前端
    ec, out, _ = run_ssh(client,
        "curl -s -o /dev/null -w '%{http_code}' http://localhost/")
    if out.strip() in ("200", "301", "302", "304"):
        print(f"  前端访问: 通过 ({out.strip()})")
    else:
        print(f"  前端访问: {out.strip()}")

    return True


def main():
    print("=" * 50)
    print(f"  My Awesome Blog - 部署到 {SERVER_IP}")
    print("=" * 50)

    client = create_ssh_client()
    try:
        if not step1_check_env(client):
            return 1
        if not step2_upload(client):
            return 1
        if not step3_build(client):
            return 1
        if not step4_start(client):
            return 1
        step5_verify(client)

        print("\n" + "=" * 50)
        print("  🚀 部署完成!")
        print("=" * 50)
        print(f"  前端:     http://{SERVER_IP}")
        print(f"  API 文档: http://{SERVER_IP}/docs")
        print(f"  API:      http://{SERVER_IP}/api/v1")
        return 0
    except Exception as e:
        print(f"\n  部署异常: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()


if __name__ == "__main__":
    sys.exit(main())
