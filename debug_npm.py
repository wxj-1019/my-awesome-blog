#!/usr/bin/env python3
"""调试构建容器内的 npm 状态"""
from paramiko import SSHClient, AutoAddPolicy

client = SSHClient()
client.set_missing_host_key_policy(AutoAddPolicy())
client.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, t=10):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=t)
    ec = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return ec, out, err

# 查看构建容器的网络连接
ec, out, err = run("docker exec 49d24f75a75d cat /etc/resolv.conf 2>&1")
print("=== 容器 DNS ===")
print(out.strip())

ec, out, err = run("docker exec 49d24f75a75d env | grep -i proxy 2>&1")
print("=== 容器代理环境变量 ===")
print(out.strip() or "(none)")

ec, out, err = run("docker exec 49d24f75a75d npm config list 2>&1")
print("=== 容器 npm 配置 ===")
print(out.strip()[:500])

# 检查 npm 进程在做什么
ec, out, err = run("docker exec 49d24f75a75d sh -c 'ls /app/node_modules/.package-lock.json 2>/dev/null && echo \"package-lock exists\" || echo \"no package-lock\"' 2>&1")
print("=== npm install 状态 ===")
print(out.strip())

# 检查容器内的网络连接
ec, out, err = run("docker exec 49d24f75a75d sh -c 'cat /proc/net/tcp | head -5' 2>&1")
print("=== 容器 TCP 连接 ===")
print(out.strip()[:500])

# 尝试从容器内访问外部
ec, out, err = run("timeout 5 docker exec 49d24f75a75d sh -c 'wget -q -O /dev/null https://registry.npmjs.org/ && echo npmjs OK || echo npmjs FAIL' 2>&1")
print("=== 容器 npmjs 连通性 ===")
print(out.strip())

client.close()
