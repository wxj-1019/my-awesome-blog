#!/usr/bin/env python3
"""清除缓存 + 全量重建前端"""
from paramiko import SSHClient, AutoAddPolicy
import time

c = SSHClient()
c.set_missing_host_key_policy(AutoAddPolicy())
c.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, t=10):
    sin, sout, serr = c.exec_command(cmd, timeout=t)
    ec = sout.channel.recv_exit_status()
    out = sout.read().decode('utf-8', errors='replace')
    return ec, out

# 确保文件最新
print("=== 上传最新文件 ===")
sftp = c.open_sftp()
sftp.put(r'e:\project\my-awesome-blog\frontend\src\components\home\FeaturedHighlights.tsx',
         '/opt/my-awesome-blog/frontend/src/components/home/FeaturedHighlights.tsx')
sftp.close()

# 清除 Docker 构建缓存
print("=== 清除 Docker 构建缓存 ===")
run('docker builder prune -f 2>&1', t=30)
print("  缓存已清除")

# 后台全量重建（--no-cache 确保使用最新文件）
print("=== 全量重建（--no-cache）===")
sin, sout, serr = c.exec_command(
    'cd /opt/my-awesome-blog && '
    'nohup docker build --no-cache --network host -t my-awesome-blog-frontend ./frontend '
    '> /tmp/frontend-fresh.log 2>&1 &',
    timeout=5
)
sin.close(); sout.close(); serr.close()
print("  已启动（日志: /tmp/frontend-fresh.log）")

# 轮询（全量重建会很慢，等 20 分钟）
print("等待全量构建...")
for i in range(120):
    time.sleep(10)
    ec, out = run('pgrep -f "docker build.*frontend" || echo "DONE"', t=5)
    ec2, log = run('tail -1 /tmp/frontend-fresh.log 2>/dev/null || echo "..."', t=5)
    tail = log.strip()[-80:]
    if i % 6 == 0:  # 每分钟报告一次
        print(f"  [{i*10+10}s] {tail}")
    if 'DONE' in out:
        break
    if 'naming to docker.io' in log or 'Successfully tagged' in log:
        time.sleep(5)
        break

# 检查
print("\n=== 结果 ===")
ec, out = run("docker images my-awesome-blog-frontend --format '{{.Size}} {{.CreatedAt}}'", t=5)
if out.strip():
    print(f"  镜像: {out.strip()}")
    
    # 启动服务
    sftp = c.open_sftp()
    sftp.put(r'e:\project\my-awesome-blog\docker-compose.prod.yml', '/opt/my-awesome-blog/docker-compose.prod.yml')
    sftp.put(r'e:\project\my-awesome-blog\frontend\nginx.conf', '/opt/my-awesome-blog/nginx/nginx.conf')
    sftp.close()
    
    print("=== 启动 ===")
    run('cd /opt/my-awesome-blog && docker compose -f docker-compose.prod.yml up -d', t=120)
    time.sleep(25)
    ec, out = run('cd /opt/my-awesome-blog && docker compose -f docker-compose.prod.yml ps', t=10)
    print(out)
else:
    print("  失败! 日志:")
    ec, out = run('tail -15 /tmp/frontend-fresh.log', t=5)
    print(out[-500:])

c.close()
