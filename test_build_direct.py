#!/usr/bin/env python3
"""在服务器上直接测试 npm run build"""
from paramiko import SSHClient, AutoAddPolicy

c = SSHClient()
c.set_missing_host_key_policy(AutoAddPolicy())
c.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, t=10):
    sin, sout, serr = c.exec_command(cmd, timeout=t)
    ec = sout.channel.recv_exit_status()
    out = sout.read().decode('utf-8', errors='replace')
    return ec, out

# 检查 node_modules 是否存在
print("=== 检查 node_modules ===")
ec, out = run('ls /opt/my-awesome-blog/frontend/node_modules/.package-lock.json 2>/dev/null && echo "EXISTS" || echo "MISSING"', t=5)
print(out.strip())

# 如果没有 node_modules，先安装
if 'MISSING' in out:
    print("安装依赖...")
    ec, out = run('cd /opt/my-awesome-blog/frontend && npm config set registry https://registry.npmmirror.com && npm ci --legacy-peer-deps --ignore-scripts 2>&1 | tail -5', t=300)
    print(out[:500])

# 测试构建
print("=== 测试构建 ===")
sin, sout, serr = c.exec_command(
    'cd /opt/my-awesome-blog/frontend && npx next build 2>&1 | tail -20',
    timeout=300
)
ec = sout.channel.recv_exit_status()
out = sout.read().decode('utf-8', errors='replace')
print(f"  退出码: {ec}")
# 查找关键错误
for line in out.split('\n'):
    if 'error' in line.lower() or 'Error' in line:
        print(f"  !! {line.strip()[:120]}")

c.close()
