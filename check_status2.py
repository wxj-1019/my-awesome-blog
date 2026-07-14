#!/usr/bin/env python3
"""检查服务器 Docker 容器状态"""
from paramiko import SSHClient, AutoAddPolicy

c = SSHClient()
c.set_missing_host_key_policy(AutoAddPolicy())
c.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, t=10):
    sin, sout, serr = c.exec_command(cmd, timeout=t)
    ec = sout.channel.recv_exit_status()
    out = sout.read().decode('utf-8', errors='replace')
    err = serr.read().decode('utf-8', errors='replace')
    return ec, out, err

# 容器状态
print("=== 容器状态 ===")
ec, out, err = run("docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>&1", t=10)
print(out)

# 后端日志
print("=== 后端日志 ===")
ec, out, err = run("docker logs my-awesome-blog-backend-1 --tail 10 2>&1", t=10)
print(out)

# 健康检查
print("=== 健康检查 ===")
ec, out, err = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:8989/health 2>&1", t=10)
print(f"HTTP status: {out}")

# 前端镜像
print("=== 前端镜像 ===")
ec, out, err = run("docker images my-awesome-blog-frontend 2>&1", t=10)
print(out)

# 还有哪些容器在运行
print("=== 所有 compose 容器 ===")
ec, out, err = run("cd /opt/my-awesome-blog && docker compose -f docker-compose.prod.yml ps 2>&1", t=10)
print(out)

c.close()
