#!/usr/bin/env python3
"""获取完整构建错误"""
from paramiko import SSHClient, AutoAddPolicy
c = SSHClient()
c.set_missing_host_key_policy(AutoAddPolicy())
c.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, t=10):
    sin, sout, serr = c.exec_command(cmd, timeout=t)
    ec = sout.channel.recv_exit_status()
    out = sout.read().decode('utf-8', errors='replace')
    return ec, out

# 获取所有 turbopack 错误
print("=== 构建日志中搜索 'Ecmascript\\|Module not found\\|Can.t resolve\\|error:\\\\|at <unknown>' ===")
ec, out = run("grep -E '(Ecmascript|Module not found|Can.t resolve|error:|at <unknown>)' /tmp/frontend-build2.log | grep -v 'node_modules\\|dist/'", t=10)
# 限制输出
lines = out.strip().split('\n')
for i, line in enumerate(lines[:40]):
    print(f"  {line[:150]}")

# 检查 FeaturedHighlights.tsx 需要哪些 ui 组件
print("\n=== FeaturedHighlights.tsx 导入的 UI 组件 ===")
ec, out = run("grep -E 'from.*@/components/ui/' /opt/my-awesome-blog/frontend/src/components/home/FeaturedHighlights.tsx 2>/dev/null | head -10", t=5)
print(out[:500])

# 检查 ProfileView.tsx
print("\n=== ProfileView.tsx 导入的 UI 组件 ===")
ec, out = run("grep -E 'from.*@/components/ui/' /opt/my-awesome-blog/frontend/src/app/profile/components/ProfileView.tsx 2>/dev/null | head -10", t=5)
print(out[:500])

c.close()
