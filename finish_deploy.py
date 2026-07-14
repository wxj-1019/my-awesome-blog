#!/usr/bin/env python3
"""完成部署：重新上传、构建前端、启动服务"""
from paramiko import SSHClient, AutoAddPolicy
import time, io, tarfile, os

SERVER_IP = "192.168.100.12"
DEPLOY_PATH = "/opt/my-awesome-blog"
LOCAL = os.path.dirname(os.path.abspath(__file__))

client = SSHClient()
client.set_missing_host_key_policy(AutoAddPolicy())
client.connect(SERVER_IP, username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run_ssh(cmd, timeout=300):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    ec = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if ec != 0:
        print(f"  [ERR] {err[:200]}")
    return ec, out, err

# Step 1: 重新上传整个前端（Dockerfile 已更新）
print("=== 重新上传文件 ===")
buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode="w:gz") as tar:
    for item in ["docker-compose.prod.yml", ".env.production", "frontend"]:
        path = os.path.join(LOCAL, item)
        if os.path.isdir(path):
            for root, dirs, files in os.walk(path):
                dirs[:] = [d for d in dirs if d not in ("node_modules", ".next", ".git", ".husky", "design-system")]
                for f in files:
                    if f in (".env.local",) or f.endswith(".log"):
                        continue
                    fp = os.path.join(root, f)
                    rel = os.path.relpath(fp, LOCAL)
                    tar.add(fp, arcname=rel)
        elif os.path.isfile(path):
            tar.add(path, arcname=item)

size_mb = buf.tell() / (1024 * 1024)
print(f"  打包: {size_mb:.1f} MB")
buf.seek(0)
sftp = client.open_sftp()
sftp.putfo(buf, f"{DEPLOY_PATH}/deploy.tar.gz")
sftp.close()
print("  上传完成")
run_ssh(f"cd {DEPLOY_PATH} && tar xzf deploy.tar.gz && rm deploy.tar.gz && cp .env.production .env")

# Step 2: 构建前端
print("\n=== 构建前端镜像 ===")
print("  正在构建 (--network host)...")
ec, out, err = run_ssh(f"cd {DEPLOY_PATH} && docker build --network host -t my-awesome-blog-frontend ./frontend 2>&1", timeout=1800)
if ec == 0:
    print("  前端构建成功!")
else:
    # 显示错误
    lines = (out + err).split('\n')
    relevant = [l for l in lines if 'error' in l.lower() or 'fail' in l.lower() or l.startswith('Step')]
    print(f"  构建失败! 退出码: {ec}")
    for l in relevant[-10:]:
        print(f"    {l[:150]}")
    # 尝试直接用 docker pull 拉取镜像修复
    print("\n  尝试预拉取镜像...")
    ec2, out2, err2 = run_ssh("docker pull node:20-alpine 2>&1", timeout=120)
    if ec2 == 0:
        print("  镜像拉取成功，重试构建...")
        ec, out, err = run_ssh(f"cd {DEPLOY_PATH} && docker build --network host -t my-awesome-blog-frontend ./frontend 2>&1", timeout=1800)
        if ec != 0:
            print(f"  二次构建仍失败: {ec}")
            client.close()
            exit(1)
    else:
        print(f"  镜像拉取也失败")
        client.close()
        exit(1)

# Step 3: 启动服务
print("\n=== 启动服务 ===")
run_ssh(f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null; docker compose -f docker-compose.prod.yml up -d 2>&1", timeout=120)
print("  等待服务就绪 (15s)...")
time.sleep(15)

# Step 4: 数据库迁移
print("\n=== 数据库迁移 ===")
run_ssh(f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head 2>&1", timeout=60)

# Step 5: 验证
print("\n=== 验证 ===")
ec, out, _ = run_ssh("curl -s http://localhost/ 2>&1 | head -c 200")
print(f"  前端: {out[:100]}")
ec, out, _ = run_ssh("curl -s -o /dev/null -w '%{http_code}' http://localhost:8989/health")
print(f"  后端健康: {out.strip()}")

print(f"\n🎉 部署完成! 访问 http://{SERVER_IP}")
client.close()
