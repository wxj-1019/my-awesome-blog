#!/usr/bin/env python3
"""快速重建: 只上传 Dockerfile + 重建"""
from paramiko import SSHClient, AutoAddPolicy
import io, tarfile, os, time

LOCAL = r'e:\project\my-awesome-blog'
DEPLOY = '/opt/my-awesome-blog'
c = SSHClient()
c.set_missing_host_key_policy(AutoAddPolicy())
c.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, t=10):
    sin, sout, serr = c.exec_command(cmd, timeout=t)
    ec = sout.channel.recv_exit_status()
    out = sout.read().decode('utf-8', errors='replace')
    if ec != 0:
        e = serr.read().decode('utf-8', errors='replace')
        if e.strip(): print(f'  ERR: {e[:200]}')
    return ec, out

# Upload Dockerfile only
buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode='w:gz') as tar:
    tar.add(os.path.join(LOCAL, 'backend', 'Dockerfile'), arcname='backend/Dockerfile')
buf.seek(0)
sftp = c.open_sftp()
sftp.putfo(buf, f'{DEPLOY}/dockerfile.tar.gz')
sftp.close()
run(f'cd {DEPLOY} && tar xzf dockerfile.tar.gz && rm dockerfile.tar.gz')

# Rebuild
print('Building...')
ec, out = run(f'cd {DEPLOY} && docker build --network host -t my-awesome-blog-backend ./backend', t=600)
if ec != 0:
    print('Build FAILED')
    c.close()
    exit(1)
print('  Build OK')

# Recreate container
run(f'cd {DEPLOY} && docker compose -f docker-compose.prod.yml stop backend', t=10)
run(f'cd {DEPLOY} && docker compose -f docker-compose.prod.yml rm -f backend', t=5)
run(f'cd {DEPLOY} && docker compose -f docker-compose.prod.yml up -d backend', t=60)
time.sleep(12)

# Verify
ec, out = run('docker logs my-awesome-blog-backend-1 --tail 3 2>&1', t=5)
print(f'Logs: {out[:400]}')
ec, out = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:8989/health", t=10)
print(f'Health: {out.strip()}')

c.close()
if out.strip() == '200':
    print('\nBackend OK! http://192.168.100.12:8989/docs')
