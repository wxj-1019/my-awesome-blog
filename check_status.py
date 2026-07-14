#!/usr/bin/env python3
"""检查服务器上的构建进程"""
from paramiko import SSHClient, AutoAddPolicy

client = SSHClient()
client.set_missing_host_key_policy(AutoAddPolicy())
client.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, t=10):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=t)
    ec = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    return ec, out

# 检查是否有 docker build 进程在运行
ec, out = run("ps aux | grep 'docker build' | grep -v grep")
print("=== Docker build 进程 ===")
print(out.strip() or "无")

# 检查 docker 镜像列表
ec, out = run("docker images | grep my-awesome-blog")
print("=== 镜像列表 ===")
print(out.strip())

# 检查已完成的前端构建（如果有）
ec, out = run("docker images my-awesome-blog-frontend 2>&1")
print("=== 前端镜像 ===")
print(out.strip())

client.close()
