#!/usr/bin/env python3
"""修复 nginx 端口冲突"""
from paramiko import SSHClient, AutoAddPolicy
import time

c = SSHClient()
c.set_missing_host_key_policy(AutoAddPolicy())
c.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, t=10):
    sin, sout, serr = c.exec_command(cmd, timeout=t)
    ec = sout.channel.recv_exit_status()
    out = sout.read().decode('utf-8', errors='replace')
    return ec, out

# 停止旧 nginx
print("=== 停止旧 nginx-prod ===")
ec, out = run('docker stop nginx-prod 2>&1', t=15)
print(out.strip())

# 启动我们的服务
print("\n=== 重新启动所有服务 ===")
ec, out = run('cd /opt/my-awesome-blog && docker compose -f docker-compose.prod.yml up -d 2>&1', t=120)
safe = out.encode('ascii', errors='replace').decode('ascii')
print(safe[:500])

time.sleep(15)

# 完整状态
print("\n=== 服务状态 ===")
ec, out = run('cd /opt/my-awesome-blog && docker compose -f docker-compose.prod.yml ps', t=10)
safe = out.encode('ascii', errors='replace').decode('ascii')
print(safe)

# 验证
time.sleep(5)
print("\n=== HTTP 验证 ===")
ec, out = run("curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://192.168.100.12/ 2>&1", t=15)
print(f"  Homepage: HTTP {out.strip()}")
ec, out = run("curl -s --max-time 5 http://192.168.100.12/ 2>&1 | head -5", t=10)
safe = out.encode('ascii', errors='replace').decode('ascii')
print(f"  Content: {safe[:200]}")

c.close()
