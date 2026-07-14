#!/usr/bin/env python3
"""清理并直接启动服务"""
from paramiko import SSHClient, AutoAddPolicy
import time

c = SSHClient()
c.set_missing_host_key_policy(AutoAddPolicy())
c.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, t=10, timeout=10):
    sin, sout, serr = c.exec_command(cmd, timeout=timeout)
    ec = sout.channel.recv_exit_status()
    out = sout.read().decode('utf-8', errors='replace')
    err = serr.read().decode('utf-8', errors='replace')
    if ec != 0 and err.strip():
        print(f"  ERR: {err[:200]}")
    return ec, out

DEPLOY_PATH = "/opt/my-awesome-blog"

# 1. 杀掉所有前端构建
print("=== 清理构建进程 ===")
run("pkill -9 -f 'docker build.*frontend' 2>/dev/null; echo cleaned")

# 2. 检查现有镜像
print("\n=== 现有镜像 ===")
ec, out = run("docker images --format '{{.Repository}}:{{.Tag}} {{.Size}}'")
print(out.strip())

# 3. 先只启动后端 + postgres + redis (不依赖前端)
print("\n=== 启动基础服务 ===")
run(f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml up -d postgres redis backend", timeout=60)
time.sleep(10)

# 4. 检查状态
print("\n=== 服务状态 ===")
ec, out = run(f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml ps")
print(out[:500])

# 5. 数据库迁移
print("\n=== 数据库迁移 ===")
ec, out = run(f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head", timeout=60)
print(out[:500])

# 6. 验证后端
print("\n=== 后端健康检查 ===")
time.sleep(5)
ec, out = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:8989/health")
print(f"  后端: {out.strip()}")

# 7. 前端状态
print("\n=== 前端镜像状态 ===")
ec, out = run("docker images my-awesome-blog-frontend --format '{{.Repository}}:{{.Tag}} {{.Size}}'")
if out.strip():
    print(f"  前端镜像已存在: {out.strip()}")
    print("  启动前端和 nginx...")
    run(f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml up -d frontend nginx", timeout=60)
    time.sleep(5)
    ec, out = run("curl -s -o /dev/null -w '%{http_code}' http://localhost/")
    print(f"  前端: {out.strip()}")
else:
    print("  前端镜像尚未构建，请稍候单独构建")

c.close()
print(f"\n如果后端启动成功，可通过 http://192.168.100.12:8989/docs 访问 API")
