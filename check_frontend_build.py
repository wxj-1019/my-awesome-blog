#!/usr/bin/env python3
"""检查前端构建状态"""
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

# 检查构建进程
print("=== 构建进程 ===")
ec, out, err = run('pgrep -fa "docker build.*frontend" || echo "No build process"', t=5)
print(out)

# 检查日志
print("=== 构建日志（最后20行）===")
ec, out, err = run('tail -20 /tmp/frontend-build.log 2>/dev/null || echo "No log file"', t=5)
print(out)

# 检查镜像
print("=== 前端镜像 ===")
ec, out, err = run("docker images my-awesome-blog-frontend --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}'", t=5)
print(out)

# 检查磁盘空间
print("=== 磁盘空间 ===")
ec, out, err = run("df -h / | tail -1", t=5)
print(out)

c.close()
