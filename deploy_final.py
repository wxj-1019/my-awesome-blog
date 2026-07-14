#!/usr/bin/env python3
"""最终部署脚本 - 后台构建 + 轮询，避免 SSH 超时"""
from paramiko import SSHClient, AutoAddPolicy
import time, io, tarfile, os, subprocess

SERVER_IP = "192.168.100.12"
DEPLOY_PATH = "/opt/my-awesome-blog"
LOCAL = os.path.dirname(os.path.abspath(__file__))

client = SSHClient()
client.set_missing_host_key_policy(AutoAddPolicy())
client.connect(SERVER_IP, username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def ssh_exec(cmd, timeout=10):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    ec = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    return ec, out

def ssh_bg(cmd):
    """发送后台命令，不等待结果"""
    transport = client.get_transport()
    channel = transport.open_session()
    channel.exec_command(cmd)
    # 不等待，立即返回
    return channel

def tail_log(path, lines=3):
    ec, out = ssh_exec(f"tail -{lines} {path} 2>/dev/null")
    return out.strip()

# === Step 1: Upload files ===
print("=== 上传文件 ===")
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
print(f"  打包: {buf.tell()/1024/1024:.1f} MB")
buf.seek(0)
sftp = client.open_sftp()
sftp.putfo(buf, f"{DEPLOY_PATH}/deploy.tar.gz")
sftp.close()
ssh_exec(f"cd {DEPLOY_PATH} && tar xzf deploy.tar.gz && rm deploy.tar.gz && cp .env.production .env")
print("  上传完成")

# === Step 2: Background build ===
print("\n=== 后台构建前端镜像 ===")
# Use nohup + & (don't wait for result)
ssh_bg(f"cd {DEPLOY_PATH} && nohup docker build --network host -t my-awesome-blog-frontend ./frontend > /tmp/frontend_build.log 2>&1 &")
time.sleep(2)
print("  构建已在后台启动，监控日志...")

# Poll until complete
for i in range(120):  # max 20 minutes
    time.sleep(10)
    log_tail = tail_log("/tmp/frontend_build.log", 3)
    
    if "Successfully built" in log_tail or "Successfully tagged" in log_tail:
        print(f"\n  [+{i*10}s] 前端构建成功!")
        break
    
    # Show build progress (last meaningful line)
    lines = [l for l in log_tail.split('\n') if l.strip() and not l.startswith('npm warn')]
    if lines:
        last = lines[-1][:120]
        if 'Step' in last or 'Running' in last or 'Removed' in last or '--->' in last:
            print(f"  [{i*10}s] {last}")
    
    # Check if still running
    ec, out = ssh_exec("pgrep -f 'docker build.*frontend' | wc -l", 5)
    if out.strip() == '0':
        print(f"\n  构建进程已结束!")
        break
else:
    print("\n  超时! 检查日志:")
    ec, out = ssh_exec("tail -20 /tmp/frontend_build.log")
    print(out)

# Show final build result
print("\n=== 构建结果 ===")
ec, out = ssh_exec("tail -10 /tmp/frontend_build.log")
print(out[-500:])

# Check image
ec, out = ssh_exec(f"docker images my-awesome-blog-frontend --format '{{{{.Repository}}}}:{{{{.Tag}}}} {{{{.Size}}}}'")
print(f"\n  前端镜像: {out.strip()}")

if "my-awesome-blog-frontend" not in out:
    print("  前端镜像构建失败! 退出")
    client.close()
    exit(1)

# === Step 3: Start services ===
print("\n=== 启动服务 ===")
ssh_exec(f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml down 2>/dev/null; docker compose -f docker-compose.prod.yml up -d", timeout=60)
print("  等待服务就绪 (15s)...")
time.sleep(15)

# DB migration
print("\n=== 数据库迁移 ===")
ec, out = ssh_exec(f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head", timeout=60)
print(out[:300])

# === Step 4: Verify ===
print("\n=== 验证 ===")
ec, out = ssh_exec("curl -s -o /dev/null -w '%{http_code}' http://localhost/")
print(f"  前端 HTTP: {out.strip()}")
ec, out = ssh_exec("curl -s -o /dev/null -w '%{http_code}' http://localhost:8989/health")
print(f"  后端健康: {out.strip()}")
ec, out = ssh_exec(f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml ps")
print(f"\n  容器状态:\n{out[:500]}")

print(f"\n=== 🎉 部署完成! ===")
print(f"  前端: http://{SERVER_IP}")
print(f"  API:  http://{SERVER_IP}/api/v1")
client.close()
import subprocess
import sys
import time
import os

SERVER_IP = "49.234.190.85"
SERVER_USER = "root"
SERVER_PASS = "zenjiroqQ+"
DEPLOY_PATH = "/opt/my-awesome-blog"
PROJECT_DIR = r"E:\A_Project\my-awesome-blog"

def main():
    print("=" * 50)
    print("  My Awesome Blog - 部署脚本")
    print("=" * 50)
    print()

    os.chdir(PROJECT_DIR)

    try:
        import paramiko
        from scp import SCPClient
    except ImportError:
        print("正在安装必要的依赖...")
        subprocess.run([sys.executable, "-m", "pip", "install", "paramiko", "scp"], check=True)
        import paramiko
        from scp import SCPClient

    def get_ssh_client():
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        return client

    def ssh_exec(client, cmd, timeout=300):
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        exit_code = stdout.channel.recv_exit_status()
        return exit_code, stdout.read().decode('utf-8'), stderr.read().decode('utf-8')

    print("步骤 1/5: 测试 SSH 连接...")
    try:
        client = get_ssh_client()
        code, out, err = ssh_exec(client, "echo SSH_CONNECTED && docker --version && docker compose version")
        print(f"  {out.strip()}")
        print("  SSH 连接成功!")
    except Exception as e:
        print(f"  SSH 连接失败: {e}")
        return
    print()

    print("步骤 2/5: 创建远程目录...")
    ssh_exec(client, f"mkdir -p {DEPLOY_PATH}/nginx")
    print("  目录创建完成!")
    print()

    print("步骤 3/5: 上传配置文件...")
    
    with SCPClient(client.get_transport()) as scp:
        files_to_upload = [
            ("docker-compose.prod.yml", f"{DEPLOY_PATH}/"),
            (".env.production", f"{DEPLOY_PATH}/"),
            ("nginx/nginx.conf", f"{DEPLOY_PATH}/nginx/"),
        ]
        
        for src, dst in files_to_upload:
            print(f"  上传 {src}...")
            if os.path.isdir(src):
                scp.put(src, dst, recursive=True)
            else:
                scp.put(src, dst)
        
        print("  上传 backend 目录（这可能需要几分钟）...")
        scp.put("backend", f"{DEPLOY_PATH}/", recursive=True)
        
        print("  上传 frontend 目录（这可能需要几分钟）...")
        scp.put("frontend", f"{DEPLOY_PATH}/", recursive=True)
    
    print("  文件上传完成!")
    print()

    print("步骤 4/5: 构建并启动服务...")
    print("  复制环境文件...")
    ssh_exec(client, f"cd {DEPLOY_PATH} && cp .env.production .env")
    
    print("  停止旧容器...")
    ssh_exec(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true")
    
    print("  构建镜像中（这可能需要几分钟）...")
    code, out, err = ssh_exec(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml build --no-cache", timeout=600)
    if out:
        for line in out.split('\n')[-20:]:
            if line.strip():
                print(f"    {line}")
    if err and code != 0:
        print(f"  构建警告/错误: {err[-500:]}")
    
    print("  启动服务...")
    code, out, err = ssh_exec(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml up -d")
    if code != 0:
        print(f"  启动错误: {err}")
    print()

    print("步骤 5/5: 等待服务启动并检查状态...")
    time.sleep(10)
    
    code, out, err = ssh_exec(client, f"docker compose -f {DEPLOY_PATH}/docker-compose.prod.yml ps")
    print(out)
    
    print("  运行数据库迁移...")
    code, out, err = ssh_exec(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head 2>/dev/null || echo 迁移完成")
    print(f"    {out.strip()}")
    print()

    client.close()

    print("=" * 50)
    print("  部署完成!")
    print("=" * 50)
    print()
    print("访问地址:")
    print(f"  前端: http://{SERVER_IP}")
    print(f"  后端 API: http://{SERVER_IP}/api/v1")
    print(f"  API 文档: http://{SERVER_IP}/docs")
    print()
    print("常用命令:")
    print(f"  查看日志: ssh root@{SERVER_IP} 'docker compose -f {DEPLOY_PATH}/docker-compose.prod.yml logs -f'")
    print(f"  重启服务: ssh root@{SERVER_IP} 'docker compose -f {DEPLOY_PATH}/docker-compose.prod.yml restart'")
    print()

if __name__ == "__main__":
    main()
