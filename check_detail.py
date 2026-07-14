#!/usr/bin/env python3
from paramiko import SSHClient, AutoAddPolicy
c = SSHClient()
c.set_missing_host_key_policy(AutoAddPolicy())
c.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)
def run(cmd, t=10):
    sin, sout, serr = c.exec_command(cmd, timeout=t)
    ec = sout.channel.recv_exit_status()
    out = sout.read().decode('utf-8', errors='replace')
    return ec, out

print("=== Build5 日志全部 ===")
ec, out = run('cat /tmp/frontend-build5.log', t=10)
# 只显示关键部分
for line in out.split('\n'):
    if 'error' in line.lower() or 'Error' in line or 'Unexpected' in line or 'unexpected' in line.lower():
        print(f"  >> {line[:150]}")
    elif 'at <unknown>' in line:
        print(f"  {line[:150]}")

# 也检查本地 FeaturedHighlights.tsx 的 430 行确认本地更新
import os
local_path = r'e:\project\my-awesome-blog\frontend\src\components\home\FeaturedHighlights.tsx'
with open(local_path, 'r') as f:
    lines = f.readlines()
print(f"\n=== 本地第 430 行 ===")
print(f"  {lines[429].rstrip()}")

c.close()
