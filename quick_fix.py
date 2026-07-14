#!/usr/bin/env python3
"""快速修复：上传 docker-compose + 重启后端"""
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
        print(f"  ERR: {err[:200]}")
    return ec, out

DEPLOY = "/opt/my-awesome-blog"

# Upload docker-compose.prod.yml
print("=== 上传 docker-compose.prod.yml ===")
sftp = c.open_sftp()
sftp.put(r"e:\project\my-awesome-blog\docker-compose.prod.yml", f"{DEPLOY}/docker-compose.prod.yml")
sftp.close()
print("  Done")

# Stop, remove, recreate backend
print("=== 重建后端容器 ===")
run(f"cd {DEPLOY} && docker compose -f docker-compose.prod.yml stop backend", t=10)
run(f"cd {DEPLOY} && docker compose -f docker-compose.prod.yml rm -f backend", t=5)
run(f"cd {DEPLOY} && docker compose -f docker-compose.prod.yml up -d backend", t=60)
time.sleep(15)

# Check
print("=== 验证 ===")
ec, out = run("docker logs my-awesome-blog-backend-1 --tail 5 2>&1", t=5)
print(f"  日志:\n{out[:400]}")
ec, out = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:8989/health", t=10)
print(f"  健康: {out.strip()}")

c.close()
if out.strip() == '200':
    print("\n🎉 后端启动成功! http://192.168.100.12:8989/docs")
