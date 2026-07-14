#!/usr/bin/env python3
"""检查前端构建进度"""
from paramiko import SSHClient, AutoAddPolicy

client = SSHClient()
client.set_missing_host_key_policy(AutoAddPolicy())
client.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, t=10):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=t)
    ec = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    return ec, out

# 检查构建容器日志（如果有运行中的容器）
ec, out = run("docker ps --filter ancestor=node:20-alpine --format '{{.ID}} {{.Status}} {{.Image}}'")
print("=== 运行中的构建容器 ===")
print(out.strip() or "无")

# 检查进程 CPU 占用
ec, out = run("ps aux | grep 'docker build\|npm\|next' | grep -v grep | head -5")
print("=== 构建相关进程 ===")
print(out.strip() or "无")

# 检查前端目录下是否有 node_modules（说明 npm install 完成了）
ec, out = run("ls -la /opt/my-awesome-blog/frontend/node_modules/.package-lock.json 2>/dev/null && echo 'npm install 完成' || echo 'npm install 未完成或未开始'")
print("=== npm install 状态 ===")
print(out.strip())

client.close()
