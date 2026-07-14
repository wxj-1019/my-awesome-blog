#!/usr/bin/env python3
"""强制重建后端容器"""
from paramiko import SSHClient, AutoAddPolicy
import time

c = SSHClient()
c.set_missing_host_key_policy(AutoAddPolicy())
c.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, t=10):
    sin, sout, serr = c.exec_command(cmd, timeout=t)
    ec = sout.channel.recv_exit_status()
    out = sout.read().decode('utf-8', errors='replace')
    err = serr.read().decode('utf-8', errors='replace')
    if ec != 0 and err.strip():
        print(f"  ERR({ec}): {err[:200]}")
    return ec, out

DEPLOY = "/opt/my-awesome-blog"

# Stop and remove old backend container
print("=== 停止旧容器 ===")
run(f"cd {DEPLOY} && docker compose -f docker-compose.prod.yml stop backend", t=30)
run(f"cd {DEPLOY} && docker compose -f docker-compose.prod.yml rm -f backend", t=10)

# Force recreate
print("=== 重新创建 ===")
run(f"cd {DEPLOY} && docker compose -f docker-compose.prod.yml up -d --force-recreate backend", t=60)
time.sleep(15)

# Check
print("=== 状态 ===")
ec, out = run("docker ps --filter name=my-awesome-blog-backend --format '{{.Status}}'", t=5)
print(f"  容器: {out.strip()}")

ec, out = run("docker logs my-awesome-blog-backend-1 2>&1 | tail -15", t=5)
print(f"  日志:\n{out[:500]}")

ec, out = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:8989/health", t=10)
print(f"  健康: {out.strip()}")

c.close()
