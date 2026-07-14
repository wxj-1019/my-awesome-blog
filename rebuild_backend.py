#!/usr/bin/env python3
"""快速重建后端镜像并重启"""
from paramiko import SSHClient, AutoAddPolicy
import io, tarfile, os, time

LOCAL = r'e:\project\my-awesome-blog'
DEPLOY = '/opt/my-awesome-blog'

c = SSHClient()
c.set_missing_host_key_policy(AutoAddPolicy())
c.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, timeout=10):
    sin, sout, serr = c.exec_command(cmd, timeout=timeout)
    ec = sout.channel.recv_exit_status()
    out = sout.read().decode('utf-8', errors='replace')
    if ec != 0:
        err = serr.read().decode('utf-8', errors='replace')
        print(f'  ERR({ec}): {err[:200]}')
    return ec, out

# Upload backend files
print('Uploading backend...')
buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode='w:gz') as tar:
    for root, dirs, files in os.walk(os.path.join(LOCAL, 'backend')):
        dirs[:] = [d for d in dirs if d not in ('venv','.venv','__pycache__','.git','logs','.pytest_cache')]
        for f in files:
            if f.endswith('.pyc') or f.endswith('.log') or f.endswith('.db'):
                continue
            fp = os.path.join(root, f)
            rel = os.path.relpath(fp, LOCAL)
            tar.add(fp, arcname=rel)
buf.seek(0)
sftp = c.open_sftp()
sftp.putfo(buf, f'{DEPLOY}/backend.tar.gz')
sftp.close()
run(f'cd {DEPLOY} && tar xzf backend.tar.gz && rm backend.tar.gz')
print('  Done')

# Rebuild (fast - cached layers)
print('Rebuilding backend...')
ec, out = run(f'cd {DEPLOY} && docker build --network host -t my-awesome-blog-backend ./backend', timeout=600)
if ec != 0:
    print('Rebuild FAILED!')
    c.close()
    exit(1)
print('  OK')

# Restart
print('Restarting...')
run(f'cd {DEPLOY} && docker compose -f docker-compose.prod.yml up -d backend', timeout=30)
time.sleep(10)

# Verify
ec, out = run('docker logs my-awesome-blog-backend-1 --tail 10', timeout=5)
print(f'Logs:\n{out[:400]}')
ec, out = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:8989/health", timeout=10)
print(f'Health: {out.strip()}')

c.close()
