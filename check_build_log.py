#!/usr/bin/env python3
"""查看前端构建完整日志"""
from paramiko import SSHClient, AutoAddPolicy

c = SSHClient()
c.set_missing_host_key_policy(AutoAddPolicy())
c.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, t=10):
    sin, sout, serr = c.exec_command(cmd, timeout=t)
    ec = sout.channel.recv_exit_status()
    out = sout.read().decode('utf-8', errors='replace')
    return ec, out

# 查找关键的模块错误
print("=== 搜索 'Module not found' ===")
ec, out = run("grep -i 'Module not found\\|Cannot find module\\|Can.t resolve' /tmp/frontend-build.log | head -30", t=10)
print(out[:2000])

print("\n=== 搜索 'error\\|Error' ===")
ec, out = run("grep -i 'error' /tmp/frontend-build.log | head -30", t=10)
print(out[:2000])

print("\n=== 日志尾部 60 行 ===")
ec, out = run("tail -60 /tmp/frontend-build.log", t=10)
print(out[-3000:])

c.close()
