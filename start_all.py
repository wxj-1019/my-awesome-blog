#!/usr/bin/env python3
"""启动所有服务并验证"""
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

DEPLOY = '/opt/my-awesome-blog'

# 更新配置
print("=== 更新配置 ===")
sftp = c.open_sftp()
sftp.put(r'e:\project\my-awesome-blog\docker-compose.prod.yml', f'{DEPLOY}/docker-compose.prod.yml')
sftp.put(r'e:\project\my-awesome-blog\frontend\nginx.conf', f'{DEPLOY}/nginx/nginx.conf')
sftp.close()
run(f'mkdir -p {DEPLOY}/nginx/ssl', t=5)

# 启动所有服务
print("=== 启动所有服务 ===")
ec, out = run(f'cd {DEPLOY} && docker compose -f docker-compose.prod.yml up -d 2>&1', t=120)
if ec != 0:
    err = out
    print(f"ERR: {err[:300]}")

time.sleep(20)

# 状态
print("\n=== 服务状态 ===")
ec, out = run(f'cd {DEPLOY} && docker compose -f docker-compose.prod.yml ps', t=10)
safe = out.encode('ascii', errors='replace').decode('ascii')
print(safe)

# 验证
time.sleep(10)
print("=== HTTP 验证 ===")
for url, label in [
    ("http://192.168.100.12/", "Nginx 80"),
    ("http://192.168.100.12/api/v1/articles/?limit=1", "API"),
]:
    ec, out = run(f"curl -s -o /dev/null -w '%{{http_code}}' --max-time 10 {url} 2>&1", t=15)
    print(f"  {label}: HTTP {out.strip()}")

c.close()
print("\nDone! Visit: http://192.168.100.12/")
