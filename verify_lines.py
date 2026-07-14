#!/usr/bin/env python3
from paramiko import SSHClient, AutoAddPolicy
c = SSHClient()
c.set_missing_host_key_policy(AutoAddPolicy())
c.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)
def run(cmd, t=10):
    sin, sout, serr = c.exec_command(cmd, timeout=t)
    ec = sout.channel.recv_exit_status()
    out = sout.read().decode('utf-8', errors='replace')
    return ec, out

FP = '/opt/my-awesome-blog/frontend/src/components/home/FeaturedHighlights.tsx'
print("=== 检查服务器 FeaturedHighlights.tsx ===")
for line_num in [118, 180, 430]:
    ec, out = run(f"sed -n '{line_num}p' {FP}", t=5)
    print(f"  L{line_num}: {out.strip()}")

ec, out = run(f"wc -l {FP}", t=5)
print(f"  总行数: {out.strip()}")

# 检查最后 10 行
print("=== 最后 10 行 ===")
ec, out = run(f"tail -10 {FP}", t=5)
print(out[:600])

c.close()
