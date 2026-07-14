#!/usr/bin/env python3
"""上传缺失的 UI 组件文件并重建前端"""
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
    return ec, out

# 上传两个新文件
print("=== 上传缺失文件 ===")
sftp = c.open_sftp()
sftp.put(
    os.path.join(LOCAL, 'frontend', 'src', 'components', 'ui', 'label.tsx'),
    f'{DEPLOY}/frontend/src/components/ui/label.tsx'
)
sftp.put(
    os.path.join(LOCAL, 'frontend', 'src', 'components', 'ui', 'progress.tsx'),
    f'{DEPLOY}/frontend/src/components/ui/progress.tsx'
)
sftp.close()
print("  label.tsx + progress.tsx 已上传")

# 后台构建
print("=== 启动后台构建 ===")
sin, sout, serr = c.exec_command(
    f'cd {DEPLOY} && '
    f'nohup docker build --network host -t my-awesome-blog-frontend ./frontend '
    f'> /tmp/frontend-build2.log 2>&1 &',
    timeout=5
)
sin.close(); sout.close(); serr.close()

# 轮询
print("等待构建完成...")
for i in range(60):  # 最多 10 分钟
    time.sleep(10)
    ec, out = run('pgrep -f "docker build.*frontend" || echo "DONE"', t=5)
    ec2, log = run('tail -1 /tmp/frontend-build2.log 2>/dev/null || echo "wait..."', t=5)
    print(f"  [{i*10+10}s] {log.strip()[-80:]}")
    if 'DONE' in out:
        break

# 检查结果
print("\n=== 构建结果 ===")
ec, out = run('tail -10 /tmp/frontend-build2.log', t=5)
print(out[-500:])

ec, out = run("docker images my-awesome-blog-frontend --format '{{.Repository}}\t{{.Tag}}\t{{.Size}}'", t=5)
if out.strip():
    print(f"  镜像已创建: {out.strip()}")
    
    # 启动所有服务
    print("\n=== 启动所有服务 ===")
    ec, out = run(f'cd {DEPLOY} && docker compose -f docker-compose.prod.yml up -d', t=120)
    time.sleep(15)
    
    print("=== 服务状态 ===")
    ec, out = run(f'cd {DEPLOY} && docker compose -f docker-compose.prod.yml ps', t=10)
    print(out)
else:
    print("  前端构建失败!")

c.close()
