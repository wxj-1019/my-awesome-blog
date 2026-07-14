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

# 搜索 FeaturedHighlights.tsx 的具体错误
print("=== FeaturedHighlights 相关错误 ===")
ec, out = run("grep -B5 'FeaturedHighlights' /tmp/frontend-build4.log | head -40", t=5)
print(out[:2000])

print("\n=== 所有 Can't resolve / Module not found ===")
ec, out = run("grep -E \"Can't resolve|Module not found\" /tmp/frontend-build4.log | head -20", t=5)
print(out[:2000])

# 检查 FeaturedHighlights.tsx 第 507 行附近
print("\n=== FeaturedHighlights.tsx 490-520 行 ===")
ec, out = run("sed -n '490,520p' /opt/my-awesome-blog/frontend/src/components/home/FeaturedHighlights.tsx 2>/dev/null", t=5)
print(out[:1000])

c.close()
