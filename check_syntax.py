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

print("=== FeaturedHighlights.tsx 495-520 ===")
ec, out = run("sed -n '495,520p' /opt/my-awesome-blog/frontend/src/components/home/FeaturedHighlights.tsx", t=5)
print(out[:1500])

# 检查总行数
print("\n=== 总行数 ===")
ec, out = run("wc -l /opt/my-awesome-blog/frontend/src/components/home/FeaturedHighlights.tsx", t=5)
print(out)

# 检查本地的同行
print("\n=== 本地文件 495-520 ===")
import os
local_path = r'e:\project\my-awesome-blog\frontend\src\components\home\FeaturedHighlights.tsx'
if os.path.exists(local_path):
    with open(local_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    print(f"本地总行数: {len(lines)}")
    for i, line in enumerate(lines[494:520], start=495):
        print(f"  {i}: {line.rstrip()}")
else:
    print("  本地文件不存在!")

c.close()
