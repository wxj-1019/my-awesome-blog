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

print("=== 构建进程 ===")
ec, out = run('pgrep -fa "docker build" || echo "none"', t=5)
print(out[:200])

print("=== Build4 日志尾 ===")
ec, out = run('tail -3 /tmp/frontend-build4.log 2>/dev/null || echo "no log"', t=5)
print(out[:300])

print("=== 镜像 ===")
ec, out = run("docker images my-awesome-blog-frontend --format '{{.Size}}'", t=5)
print(out[:100])

print("=== label.tsx 行数 ===")
ec, out = run("wc -l /opt/my-awesome-blog/frontend/src/components/ui/label.tsx 2>/dev/null || echo 'missing'", t=5)
print(out)

print("=== progress.tsx 行数 ===")
ec, out = run("wc -l /opt/my-awesome-blog/frontend/src/components/ui/progress.tsx 2>/dev/null || echo 'missing'", t=5)
print(out)

print("=== 前端容器 ===")
ec, out = run("docker ps -a --filter name=my-awesome-blog-frontend --format '{{.Status}}'", t=5)
print(out[:200])

c.close()
