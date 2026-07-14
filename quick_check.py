#!/usr/bin/env python3
"""快速检查"""
from paramiko import SSHClient, AutoAddPolicy
c = SSHClient()
c.set_missing_host_key_policy(AutoAddPolicy())
c.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, t=10):
    sin, sout, serr = c.exec_command(cmd, timeout=t)
    ec = sout.channel.recv_exit_status()
    out = sout.read().decode('utf-8', errors='replace')
    return ec, out

print("=== 构建进程 ===")
ec, out = run('pgrep -fa "docker build" || echo "none"', t=5)
print(out[:300])

print("=== Build2 日志尾 ===")
ec, out = run('tail -5 /tmp/frontend-build2.log 2>/dev/null || echo "no log"', t=5)
print(out[:500])

print("=== 前端镜像 ===")
ec, out = run("docker images my-awesome-blog-frontend --format '{{.Size}} {{.CreatedAt}}'", t=5)
print(out[:200])

print("=== npm 进程 ===")
ec, out = run('pgrep -fa "npm\\|node" | grep -v pgrep | head -5 || echo "none"', t=5)
print(out[:300])

c.close()
