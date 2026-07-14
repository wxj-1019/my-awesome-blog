#!/usr/bin/env python3
"""直接在服务器上后台构建并监控"""
from paramiko import SSHClient, AutoAddPolicy
import time

client = SSHClient()
client.set_missing_host_key_policy(AutoAddPolicy())
client.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

# 启动后台构建
cmd = 'nohup sh -c "cd /opt/my-awesome-blog && docker build --network host -t my-awesome-blog-backend ./backend > /tmp/build_backend.log 2>&1 && echo BUILD_SUCCESS >> /tmp/build_backend.log || echo BUILD_FAILED >> /tmp/build_backend.log" & sleep 1'
stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
stdout.channel.recv_exit_status()
print('Build started in background...')

# 轮询日志
for i in range(60):
    time.sleep(10)
    stdin, stdout, stderr = client.exec_command('tail -5 /tmp/build_backend.log 2>/dev/null || echo waiting...', timeout=10)
    out = stdout.read().decode('utf-8', errors='replace')
    status = out.strip()
    if 'BUILD_SUCCESS' in status:
        print(f'\n[+{i*10}s] BUILD SUCCESS!')
        break
    elif 'BUILD_FAILED' in status:
        print(f'\n[+{i*10}s] BUILD FAILED!')
        break
    lines = [l for l in status.split('\n') if l.strip()]
    if lines:
        print(f'[{i*10}s] {lines[-1][:150]}')

# 显示完整日志尾部
print('\n=== Last 20 lines of build log ===')
stdin, stdout, stderr = client.exec_command('tail -20 /tmp/build_backend.log', timeout=10)
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
