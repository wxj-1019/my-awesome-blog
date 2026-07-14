#!/usr/bin/env python3
"""详细检查前端构建错误"""
from paramiko import SSHClient, AutoAddPolicy
c = SSHClient()
c.set_missing_host_key_policy(AutoAddPolicy())
c.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, t=10):
    sin, sout, serr = c.exec_command(cmd, timeout=t)
    ec = sout.channel.recv_exit_status()
    out = sout.read().decode('utf-8', errors='replace')
    return ec, out

print("=== 所有 Module not found 错误 ===")
ec, out = run("grep -i 'Module not found\\|Can.t resolve' /tmp/frontend-build2.log | head -20", t=5)
print(out[:2000])

print("\n=== 所有 Error 行 ===")
ec, out = run("grep -i 'Error' /tmp/frontend-build2.log | head -20", t=5)
print(out[:2000])

print("\n=== progress.tsx 在服务器上的内容 ===")
ec, out = run("wc -l /opt/my-awesome-blog/frontend/src/components/ui/progress.tsx 2>/dev/null", t=5)
print(out)
ec, out = run("cat /opt/my-awesome-blog/frontend/src/components/ui/progress.tsx", t=5)
print(out[:1000])

c.close()
