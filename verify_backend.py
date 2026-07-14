#!/usr/bin/env python3
"""验证后端状态"""
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
    return ec, out, err

# 等待健康检查通过
print("等待健康检查...")
for i in range(6):
    time.sleep(5)
    ec, out, err = run("curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:8989/health 2>&1", t=10)
    code = out.strip()
    status_ec, status_out, _ = run("docker ps --filter name=my-awesome-blog-backend --format '{{.Status}}'", t=5)
    print(f"  [{i+1}]: HTTP {code}, Status: {status_out.strip()}")
    if code == '200':
        break

# 测试 API
print("\n=== API 测试 ===")
ec, out, err = run("curl -s --max-time 10 http://localhost:8989/health 2>&1", t=15)
print(f"  /health:\n{out[:300]}")

ec, out, err = run("curl -s --max-time 10 http://localhost:8989/api/v1/articles/?limit=1 2>&1", t=15)
print(f"  /api/v1/articles:\n{out[:300]}")

# 容器日志
print("\n=== 最新日志 ===")
ec, out, err = run("docker logs my-awesome-blog-backend-1 --tail 15 2>&1", t=5)
print(out[-600:])

c.close()
