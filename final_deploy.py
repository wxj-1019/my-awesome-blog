#!/usr/bin/env python3
"""部署前端: 上传修复文件 + 构建 + 启动"""
from paramiko import SSHClient, AutoAddPolicy
import time

LOCAL = r'e:\project\my-awesome-blog'
DEPLOY = '/opt/my-awesome-blog'
UI = f'{DEPLOY}/frontend/src/components/ui'

c = SSHClient()
c.set_missing_host_key_policy(AutoAddPolicy())
c.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, t=10):
    sin, sout, serr = c.exec_command(cmd, timeout=t)
    ec = sout.channel.recv_exit_status()
    out = sout.read().decode('utf-8', errors='replace')
    return ec, out

# 1. 删除旧文件 + 上传修复版本
print("=== 清理并上传 ===")
run(f'rm -f {UI}/label.tsx {UI}/Label.tsx {UI}/progress.tsx {UI}/Progress.tsx', t=5)
sftp = c.open_sftp()
sftp.put(f'{LOCAL}/frontend/src/components/ui/label.tsx', f'{UI}/label.tsx')
sftp.put(f'{LOCAL}/frontend/src/components/ui/progress.tsx', f'{UI}/progress.tsx')
sftp.close()
print("  label.tsx + progress.tsx 已更新")

# 验证文件
ec, out = run(f"wc -l {UI}/label.tsx {UI}/progress.tsx", t=5)
print(f"  行数: {out.strip()}")

# 2. 后台构建
print("=== 后台构建 ===")
sin, sout, serr = c.exec_command(
    f'cd {DEPLOY} && nohup docker build --network host -t my-awesome-blog-frontend ./frontend '
    f'> /tmp/frontend-build4.log 2>&1 &',
    timeout=5
)
sin.close(); sout.close(); serr.close()

# 3. 轮询
print("等待构建 (每10秒检查)...")
for i in range(60):
    time.sleep(10)
    ec, out = run('pgrep -f "docker build.*frontend" || echo "DONE"', t=5)
    ec2, log = run('tail -1 /tmp/frontend-build4.log 2>/dev/null || echo "..."', t=5)
    tail = log.strip()[-100:]
    print(f"  [{i*10+10}s] {tail}")
    if 'DONE' in out:
        break
    # 提前检测成功
    if 'naming to docker.io' in log or 'Successfully tagged' in log:
        print("  发现成功标记!")
        time.sleep(5)
        break

# 4. 检查结果
print("\n=== 结果 ===")
ec, out = run("docker images my-awesome-blog-frontend --format '{{.Size}} {{.CreatedAt}}'", t=5)
if out.strip():
    print(f"  镜像: {out.strip()}")
    
    # 上传 docker-compose（确保最新的）
    sftp = c.open_sftp()
    sftp.put(f'{LOCAL}/docker-compose.prod.yml', f'{DEPLOY}/docker-compose.prod.yml')
    sftp.put(f'{LOCAL}/frontend/nginx.conf', f'{DEPLOY}/nginx/nginx.conf')
    sftp.close()
    run(f'mkdir -p {DEPLOY}/nginx/ssl', t=5)
    
    # 启动所有服务
    print("\n=== 启动所有服务 ===")
    ec, out = run(f'cd {DEPLOY} && docker compose -f docker-compose.prod.yml up -d', t=120)
    time.sleep(20)
    
    # 状态
    print("=== 服务状态 ===")
    ec, out = run(f'cd {DEPLOY} && docker compose -f docker-compose.prod.yml ps', t=10)
    print(out)
    
    # 验证
    time.sleep(10)
    print("=== HTTP 验证 ===")
    for port, name in [("80", "Nginx"), ("8989", "Backend")]:
        ec, out = run(f"curl -s -o /dev/null -w '%{{http_code}}' --max-time 5 http://192.168.100.12:{port}/ 2>&1", t=10)
        print(f"  {name} ({port}): HTTP {out.strip()}")
else:
    print("  前端构建失败!")
    ec, out = run('tail -20 /tmp/frontend-build4.log', t=5)
    print(out[-800:])

c.close()
