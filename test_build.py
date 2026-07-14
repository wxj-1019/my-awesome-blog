#!/usr/bin/env python3
"""测试服务器 Docker build --network host"""
from paramiko import SSHClient, AutoAddPolicy

client = SSHClient()
client.set_missing_host_key_policy(AutoAddPolicy())
client.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, t=300):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=t)
    ec = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return ec, out, err

# 测试 apt-get
print("=== Test: docker run with --network host ===")
ec, out, err = run("docker run --rm --network host python:3.12-slim sh -c \"apt-get update -qq && apt-get install -y -qq curl && echo SUCCESS\" 2>&1", t=120)
print(f"ec={ec}")
print(out[-500:] if len(out) > 500 else out)
if err.strip():
    print("STDERR:", err[-300:])

# 如果上面失败，试试不指定 network
if ec != 0:
    print("\n=== Test: docker run without --network host ===")
    ec, out, err = run("docker run --rm python:3.12-slim sh -c \"apt-get update -qq 2>&1 && apt-get install -y -qq curl 2>&1 && echo SUCCESS\" 2>&1", t=120)
    print(f"ec={ec}")
    print(out[-500:] if len(out) > 500 else out)

client.close()
