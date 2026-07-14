#!/usr/bin/env python3
"""上传完整 backend + 重建"""
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
    err = serr.read().decode('utf-8', errors='replace')
    if ec != 0 and err.strip():
        print(f'  ERR: {err[:300]}')
    return ec, out

# ---------- 1. 上传 backend 目录 ----------
print('=== 上传 backend 目录 (tar.gz) ===')

# 只排除特定路径前缀（避免误杀 app/models/logs 等子目录）
EXCLUDE_PREFIXES = ['backend/.venv/', 'backend/venv/', 'backend/logs/', 'backend/.git/']
EXCLUDE_NAMES = {'__pycache__', '.pytest_cache', '.egg-info', '.env', '.env.bak'}
EXCLUDE_SUFFIXES = ('.pyc', '.db')

def should_include(tarinfo):
    """过滤不需要的文件"""
    path = tarinfo.name.replace('\\', '/')
    name = os.path.basename(path)
    
    # 排除特定目录名前缀
    if tarinfo.isdir():
        for prefix in EXCLUDE_PREFIXES:
            if path + '/' == prefix or (path + '/').startswith(prefix):
                return None
    
    # 排除任何路径中包含这些目录名（仅顶层或独立目录）
    parts = path.split('/')
    for part in parts:
        if part in EXCLUDE_NAMES:
            return None
    
    # 排除特定后缀
    if name.endswith(EXCLUDE_SUFFIXES):
        return None
    
    return tarinfo

buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode='w:gz') as tar:
    tar.add(os.path.join(LOCAL, 'backend'), arcname='backend', filter=should_include)
buf.seek(0)
size_mb = len(buf.getvalue()) / 1024 / 1024

import time as _time
t0 = _time.time()
sftp = c.open_sftp()
sftp.putfo(buf, f'{DEPLOY}/backend.tar.gz')
sftp.close()
elapsed = _time.time() - t0
print(f'  上传完成: {size_mb:.1f}MB, 耗时 {elapsed:.1f}s ({size_mb/elapsed:.1f} MB/s)')

# ---------- 2. 解压 ----------
print('=== 解压覆盖 backend 目录 ===')
ec, out = run(f'cd {DEPLOY} && rm -rf backend && tar xzf backend.tar.gz && rm backend.tar.gz', t=30)
print('  解压完成')

# ---------- 3. 构建镜像 ----------
print('=== Docker 构建 ===')
ec, out = run(f'cd {DEPLOY} && docker build --network host -t my-awesome-blog-backend ./backend 2>&1', t=600)
if ec != 0:
    print(f'构建失败:\n{out[-500:]}')
    c.close()
    exit(1)
print('  构建成功')

# ---------- 4. 重建容器 ----------
print('=== 重建容器 ===')
run(f'cd {DEPLOY} && docker compose -f docker-compose.prod.yml stop backend', t=10)
run(f'cd {DEPLOY} && docker compose -f docker-compose.prod.yml rm -f backend', t=5)
run(f'cd {DEPLOY} && docker compose -f docker-compose.prod.yml up -d backend', t=60)
time.sleep(15)

# ---------- 5. 验证 ----------
print('=== 验证 ===')
ec, out = run('docker logs my-awesome-blog-backend-1 --tail 5 2>&1', t=5)
print(f'  日志:\n{out[:500]}')
ec, out = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:8989/health", t=10)
print(f'  健康状态: {out.strip()}')
ec, out = run("docker ps --filter name=my-awesome-blog-backend --format '{{.Status}}'", t=5)
print(f'  容器状态: {out.strip()}')

c.close()

if out.strip() == '200':
    print('\n[OK] Backend deployed! http://192.168.100.12:8989/docs')
else:
    print('\n[FAIL] Backend still has issues, check logs')
