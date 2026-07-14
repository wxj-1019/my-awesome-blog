#!/usr/bin/env python3
"""深入检查 npm 状态"""
from paramiko import SSHClient, AutoAddPolicy

client = SSHClient()
client.set_missing_host_key_policy(AutoAddPolicy())
client.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, t=15):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=t)
    ec = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return ec, out, err

# 1. 检查 npm 的 strace（它在等什么）
ec, out, err = run("docker exec 49d24f75a75d sh -c 'ls /app/node_modules/ 2>/dev/null | wc -l' 2>&1")
print(f"=== 已安装的包数量: {out.strip()} ===")

# 2. 检查 npm 的网络连接状态
ec, out, err = run("docker exec 49d24f75a75d sh -c 'cat /proc/net/tcp /proc/net/tcp6 2>/dev/null' 2>&1")
print(f"=== TCP 连接 ===")
for line in out.strip().split('\n')[:20]:
    print(f"  {line}")

# 3. 检查 npm 进程的 fd（文件描述符 - 看打开了什么网络连接）
ec, out, err = run("docker exec 49d24f75a75d sh -c 'ls -la /proc/1/fd/ 2>/dev/null | head -10' 2>&1")
print(f"=== PID 1 fd ===")
print(out.strip()[:500])

# 4. 找到 npm 进程的 PID 并检查其状态
ec, out, err = run("docker exec 49d24f75a75d sh -c 'ps aux' 2>&1")
print("=== 容器内进程 ===")
print(out.strip()[:500])

# 5. 杀掉重复的构建进程
print("\n=== 杀掉重复构建进程 ===")
ec, out, err = run("kill 882073 882074 2>/dev/null; echo done")
print(out.strip())

client.close()
