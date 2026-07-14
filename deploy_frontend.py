#!/usr/bin/env python3
"""上传前端 + 后台构建 + 验证"""
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
        print(f'  ERR: {err[:200]}')
    return ec, out

# ---------- 1. 上传前端 ----------
print('=== 上传前端 (tar.gz) ===')

EXCLUDE_PREFIXES = ['frontend/node_modules/', 'frontend/.next/', 'frontend/.git/',
                      'frontend/.husky/', 'frontend/design-system/']
EXCLUDE_NAMES = {'node_modules', '.next', '__pycache__', '.git'}

def should_include(tarinfo):
    path = tarinfo.name.replace('\\', '/')
    name = os.path.basename(path)
    
    if tarinfo.isdir():
        for prefix in EXCLUDE_PREFIXES:
            if path + '/' == prefix or (path + '/').startswith(prefix):
                return None
    
    parts = path.split('/')
    for part in parts:
        if part in EXCLUDE_NAMES:
            return None
    
    return tarinfo

buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode='w:gz') as tar:
    tar.add(os.path.join(LOCAL, 'frontend'), arcname='frontend', filter=should_include)
buf.seek(0)
size_mb = len(buf.getvalue()) / 1024 / 1024

t0 = time.time()
sftp = c.open_sftp()
sftp.putfo(buf, f'{DEPLOY}/frontend.tar.gz')
sftp.close()
elapsed = time.time() - t0
print(f'  上传: {size_mb:.1f}MB, {elapsed:.1f}s ({size_mb/elapsed:.1f} MB/s)')

# ---------- 2. 解压 ----------
print('=== 解压 ===')
run(f'cd {DEPLOY} && rm -rf frontend && tar xzf frontend.tar.gz && rm frontend.tar.gz', t=30)
print('  解压完成')

# ---------- 3. 上传 compose 配置 + nginx 配置 ----------
print('=== 上传 compose + nginx 配置 ===')
sftp = c.open_sftp()
sftp.put(os.path.join(LOCAL, 'docker-compose.prod.yml'), f'{DEPLOY}/docker-compose.prod.yml')
sftp.put(os.path.join(LOCAL, 'frontend', '.env.production'), f'{DEPLOY}/frontend/.env.production')
sftp.close()

# 创建 nginx 目录并上传配置
run(f'mkdir -p {DEPLOY}/nginx/ssl', t=5)
sftp = c.open_sftp()
sftp.put(os.path.join(LOCAL, 'frontend', 'nginx.conf'), f'{DEPLOY}/nginx/nginx.conf')
sftp.close()
print('  完成')

# ---------- 4. 后台构建前端 ----------
print('=== 后台构建前端 Docker 镜像（最长等待 15 分钟）===')
# 使用 exec_command 发送后台命令，不读取输出
sin, sout, serr = c.exec_command(
    f'cd {DEPLOY} && '
    f'nohup docker build --network host -t my-awesome-blog-frontend ./frontend '
    f'> /tmp/frontend-build.log 2>&1 &',
    timeout=5
)
# 不等待输出，立即关闭
sin.close()
sout.close()
serr.close()
print('  后台构建已启动，等待中...')

# 轮询检查构建状态，最多等 15 分钟
max_wait = 900  # 15 minutes
interval = 10
waited = 0
while waited < max_wait:
    time.sleep(interval)
    waited += interval
    
    # 检查 docker build 进程是否还在
    ec, out = run('pgrep -f "docker build.*my-awesome-blog-frontend" || echo "DONE"', t=5)
    
    # 检查日志最后几行
    ec2, log_out = run('tail -3 /tmp/frontend-build.log 2>/dev/null || echo "waiting..."', t=5)
    status = log_out.strip().split('\n')[-1][:100] if log_out.strip() else 'building...'
    
    # 检查镜像
    ec3, img_out = run("docker images my-awesome-blog-frontend --format '{{.Size}}' 2>/dev/null", t=5)
    
    print(f'  [{waited}s] {status}')
    
    if 'DONE' in out:
        print('  Build process ended, checking result...')
        break
    if img_out.strip():
        ec4, full_log = run('tail -20 /tmp/frontend-build.log 2>/dev/null', t=5)
        if 'Successfully tagged' in full_log or 'naming to docker.io' in full_log:
            print('  Build appears successful!')
            break

# 最终检查
ec, out = run("docker images my-awesome-blog-frontend --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}'", t=5)
print(f'\n=== 前端镜像 ===\n{out}')

if 'my-awesome-blog-frontend' not in out:
    print('\n前端构建似乎失败，查看日志:')
    ec, out = run('tail -40 /tmp/frontend-build.log', t=5)
    print(out[-1000:])
    c.close()
    exit(1)

# ---------- 5. 启动所有服务 ----------
print('=== 启动所有服务 ===')
run(f'cd {DEPLOY} && docker compose -f docker-compose.prod.yml up -d', t=120)
time.sleep(20)

# ---------- 6. 验证 ----------
print('=== 验证所有服务 ===')
ec, out = run('cd /opt/my-awesome-blog && docker compose -f docker-compose.prod.yml ps', t=10)
print(out)

# 检查 nginx
ec, out = run("curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost/ 2>&1", t=10)
print(f'  Nginx (localhost:80): HTTP {out.strip()}')

ec, out = run("curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://192.168.100.12/ 2>&1", t=10)
print(f'  Nginx (192.168.100.12:80): HTTP {out.strip()}')

c.close()
