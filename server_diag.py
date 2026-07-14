#!/usr/bin/env python3
"""诊断服务器 Docker 环境"""
from paramiko import SSHClient, AutoAddPolicy

client = SSHClient()
client.set_missing_host_key_policy(AutoAddPolicy())
client.connect('192.168.100.12', username='root', password='rongqizhizao1.!',
               look_for_keys=False, allow_agent=False)

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return exit_code, out, err

print("=== DNS Check ===")
ec, out, err = run("nslookup deb.debian.org 2>&1 || echo DNS_FAILED")
print(f"exit={ec}\n{out.strip()}\n{err.strip()}")

print("\n=== Docker apt in Container ===")
ec, out, err = run("docker run --rm python:3.12-slim apt-get update 2>&1 || echo CONTAINER_FAILED", timeout=60)
print(f"exit={ec}\n{out.strip()[:500]}")
if err.strip():
    print(f"STDERR: {err.strip()[:500]}")

print("\n=== Docker daemon.json ===")
ec, out, err = run("cat /etc/docker/daemon.json 2>/dev/null || echo NO_DAEMON_JSON")
print(out.strip())

print("\n=== Docker DNS/Proxy ===")
ec, out, err = run("docker info 2>&1 | grep -i 'proxy' || echo NO_PROXY")
print(out.strip())
ec, out, err = run("docker info 2>&1 | grep -i 'dns' || echo NO_DNS")
print(out.strip())

print("\n=== Server resolv.conf ===")
ec, out, err = run("cat /etc/resolv.conf")
print(out.strip())

print("\n=== Network connectivity ===")
ec, out, err = run("curl -s -o /dev/null -w '%{http_code}' https://deb.debian.org 2>&1 || echo CURL_FAILED", timeout=10)
print(out.strip())

client.close()
