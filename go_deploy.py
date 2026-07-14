#!/usr/bin/env python3
"""最终部署：上传修复 + 构建 + 启动"""
from paramiko import SSHClient, AutoAddPolicy
import time

LOCAL = r'e:\project\my-awesome-blog'
DEPLOY = '/opt/my-awesome-blog'

c = SSHClient()
c.set_missing_host_key_policy(AutoAddPolicy())
c.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, t=10):
    sin, sout, serr = c.exec_command(cmd, timeout=t)
    ec = sout.channel.recv_exit_status()
    out = sout.read().decode('utf-8', errors='replace')
    return ec, out

# 上传修复文件
print("=== 上传修复 ===")
sftp = c.open_sftp()
sftp.put(f'{LOCAL}/frontend/src/components/home/FeaturedHighlights.tsx',
         f'{DEPLOY}/frontend/src/components/home/FeaturedHighlights.tsx')
sftp.close()
print("  FeaturedHighlights.tsx 已更新")

# 后台构建
print("=== 构建前端 ===")
sin, sout, serr = c.exec_command(
    f'cd {DEPLOY} && nohup docker build --network host -t my-awesome-blog-frontend ./frontend '
    f'> /tmp/frontend-build5.log 2>&1 &',
    timeout=5
)
sin.close(); sout.close(); serr.close()

# 轮询
for i in range(60):
    time.sleep(10)
    ec, out = run('pgrep -f "docker build.*frontend" || echo "DONE"', t=5)
    ec2, log = run('tail -1 /tmp/frontend-build5.log 2>/dev/null || echo "..."', t=5)
    print(f"  [{i*10+10}s] {log.strip()[-80:]}")
    if 'DONE' in out:
        break
    if 'naming to docker.io' in log or 'Successfully tagged' in log:
        time.sleep(5)
        break

# 结果
ec, out = run("docker images my-awesome-blog-frontend --format '{{.Size}}'", t=5)
if out.strip():
    print(f"\n镜像: {out.strip()}")
    
    # 更新配置
    sftp = c.open_sftp()
    sftp.put(f'{LOCAL}/docker-compose.prod.yml', f'{DEPLOY}/docker-compose.prod.yml')
    sftp.put(f'{LOCAL}/frontend/nginx.conf', f'{DEPLOY}/nginx/nginx.conf')
    sftp.close()
    run(f'mkdir -p {DEPLOY}/nginx/ssl', t=5)
    
    # 启动
    print("=== 启动服务 ===")
    run(f'cd {DEPLOY} && docker compose -f docker-compose.prod.yml up -d', t=120)
    time.sleep(25)
    
    ec, out = run(f'cd {DEPLOY} && docker compose -f docker-compose.prod.yml ps', t=10)
    print(out)
    
    # 验证
    print("=== 验证 ===")
    ec, out = run("curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://192.168.100.12/ 2>&1", t=15)
    print(f"  HTTP 80: {out.strip()}")
    ec, out = run("curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://192.168.100.12/api/v1/articles/?limit=1 2>&1", t=15)
    print(f"  API: {out.strip()}")
else:
    print("  失败!")
    ec, out = run('tail -15 /tmp/frontend-build5.log', t=5)
    print(out[-500:])

c.close()
