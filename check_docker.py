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

print("=== 服务器 Dockerfile 中的 npm ci 行 ===")
ec, out = run("grep 'npm ci' /opt/my-awesome-blog/frontend/Dockerfile", t=5)
print(out)

print("=== fresh 日志尾部 ===")
ec, out = run("tail -3 /tmp/frontend-fresh.log 2>/dev/null || echo 'no log'", t=5)
print(out[:500])

print("=== 构建还在运行? ===")
ec, out = run("pgrep -f 'docker build' && echo 'YES' || echo 'NO'", t=5)
print(out.strip())

c.close()
