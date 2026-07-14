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

# 检查服务器上的 430 行
print("=== 服务器 FeaturedHighlights.tsx 第 430 行 ===")
ec, out = run("sed -n '430p' /opt/my-awesome-blog/frontend/src/components/home/FeaturedHighlights.tsx", t=5)
print(out)

print("=== Build5 日志 ===")
ec, out = run('tail -5 /tmp/frontend-build5.log 2>/dev/null || echo "no build5 log"', t=5)
print(out[:400])

print("=== 当前 build 进程 ===")
ec, out = run('ps aux | grep "docker build" | grep -v grep || echo "none"', t=5)
print(out[:300])

c.close()
