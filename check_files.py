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

# 服务器文件 MD5
print("=== MD5 对比 ===")
ec, out = run("md5sum /opt/my-awesome-blog/frontend/src/components/home/FeaturedHighlights.tsx", t=5)
server_md5 = out.split()[0] if out else 'N/A'
print(f"  服务器: {server_md5}")

import hashlib
with open(r'e:\project\my-awesome-blog\frontend\src\components\home\FeaturedHighlights.tsx', 'rb') as f:
    local_md5 = hashlib.md5(f.read()).hexdigest()
print(f"  本地:   {local_md5}")
print(f"  一致: {server_md5 == local_md5}")

# 检查导入的 ScrollReveal 和 SparkleDecoration
print("\n=== ScrollReveal 是否存在 ===")
ec, out = run("ls -la /opt/my-awesome-blog/frontend/src/components/home/decorations/ScrollReveal.tsx 2>/dev/null || echo 'MISSING'", t=5)
print(out.strip())

print("=== SparkleDecoration 是否存在 ===")
ec, out = run("ls -la /opt/my-awesome-blog/frontend/src/components/home/decorations/SparkleDecoration.tsx 2>/dev/null || echo 'MISSING'", t=5)
print(out.strip())

c.close()
