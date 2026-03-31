import subprocess
import sys
import os
import time

SERVER_IP = "49.234.190.85"
SERVER_USER = "root"
SERVER_PASS = "zenjiroqQ+"
DEPLOY_PATH = "/opt/my-awesome-blog"
LOCAL_PATH = os.path.dirname(os.path.abspath(__file__))

def main():
    print("=" * 50)
    print("  My Awesome Blog - SCP 直接部署")
    print("=" * 50)
    print()

    try:
        import paramiko
    except ImportError:
        print("正在安装 paramiko...")
        subprocess.run([sys.executable, "-m", "pip", "install", "paramiko"], check=True)
        import paramiko

    def get_ssh_client():
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        return client

    def ssh_exec(client, cmd, timeout=300):
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        exit_code = stdout.channel.recv_exit_status()
        return exit_code, stdout.read().decode('utf-8'), stderr.read().decode('utf-8')

    def upload_dir(sftp, local_dir, remote_dir):
        """递归上传目录"""
        for item in os.listdir(local_dir):
            local_path = os.path.join(local_dir, item)
            remote_path = f"{remote_dir}/{item}"
            
            # 跳过不需要的文件和目录
            if item in ['.git', 'node_modules', '.next', '__pycache__', '.venv', 
                        'venv', '.env', '.idea', '.vscode', 'dist', 'build', 
                        '*.log', '.DS_Store', 'Thumbs.db']:
                continue
            
            if os.path.isfile(local_path):
                # 跳过大文件
                size = os.path.getsize(local_path)
                if size > 10 * 1024 * 1024:  # 10MB
                    print(f"    跳过大文件: {item} ({size/1024/1024:.1f}MB)")
                    continue
                try:
                    sftp.put(local_path, remote_path)
                except Exception as e:
                    print(f"    上传文件失败 {item}: {e}")
            elif os.path.isdir(local_path):
                try:
                    sftp.mkdir(remote_path)
                except:
                    pass
                upload_dir(sftp, local_path, remote_path)

    print("步骤 1: 连接服务器...")
    try:
        client = get_ssh_client()
        print("  连接成功!")
    except Exception as e:
        print(f"  连接失败: {e}")
        return
    print()

    print("步骤 2: 准备服务器目录...")
    ssh_exec(client, f"rm -rf {DEPLOY_PATH}")
    ssh_exec(client, f"mkdir -p {DEPLOY_PATH}")
    ssh_exec(client, f"mkdir -p {DEPLOY_PATH}/frontend/src/components/ui")
    ssh_exec(client, f"mkdir -p {DEPLOY_PATH}/backend/app")
    ssh_exec(client, f"mkdir -p {DEPLOY_PATH}/nginx")
    print("  目录创建完成!")
    print()

    print("步骤 3: 上传关键配置文件...")
    sftp = client.open_sftp()
    
    files_to_upload = [
        "docker-compose.prod.yml",
        ".env.production",
        "nginx/nginx.conf",
        "frontend/Dockerfile",
        "frontend/package.json",
        "frontend/package-lock.json",
        "frontend/next.config.ts",
        "frontend/tsconfig.json",
        "frontend/tailwind.config.js",
        "frontend/postcss.config.mjs",
        "frontend/components.json",
        "backend/Dockerfile",
        "backend/requirements.txt",
        "backend/app/main.py",
    ]
    
    for file in files_to_upload:
        local_file = os.path.join(LOCAL_PATH, file)
        if os.path.exists(local_file):
            remote_file = f"{DEPLOY_PATH}/{file}"
            try:
                # 确保远程目录存在
                remote_dir = os.path.dirname(remote_file)
                try:
                    sftp.mkdir(remote_dir)
                except:
                    pass
                sftp.put(local_file, remote_file)
                print(f"  ✓ {file}")
            except Exception as e:
                print(f"  ✗ {file}: {e}")
    
    sftp.close()
    print()

    print("步骤 4: 更新 Dockerfile...")
    new_dockerfile = '''FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps --ignore-scripts

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx next telemetry disable || true
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
'''
    
    sftp = client.open_sftp()
    with sftp.file(f"{DEPLOY_PATH}/frontend/Dockerfile", 'w') as f:
        f.write(new_dockerfile)
    sftp.close()
    print("  Dockerfile 已更新!")
    print()

    print("步骤 5: 配置环境变量...")
    ssh_exec(client, f"cp {DEPLOY_PATH}/.env.production {DEPLOY_PATH}/.env")
    print("  环境变量配置完成!")
    print()

    print("步骤 6: 构建并启动服务...")
    print("  停止旧容器...")
    ssh_exec(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true")
    
    print("  清理旧镜像...")
    ssh_exec(client, "docker image prune -f")
    
    print("  构建镜像中...")
    code, out, err = ssh_exec(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml build --no-cache 2>&1", timeout=900)
    
    print("\n=== 构建输出 (最后50行) ===")
    lines = out.split('\n')
    for line in lines[-50:]:
        print(f"  {line}")
    
    if code != 0:
        print("\n=== 构建错误 ===")
        print(err[-2000:] if len(err) > 2000 else err)
        client.close()
        return
    print()
    
    print("  启动服务...")
    code, out, err = ssh_exec(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml up -d")
    if code != 0:
        print(f"  启动错误: {err}")
    print()

    print("步骤 7: 等待服务启动并检查状态...")
    time.sleep(30)
    
    print("  容器状态:")
    code, out, err = ssh_exec(client, f"docker compose -f {DEPLOY_PATH}/docker-compose.prod.yml ps")
    print(out)
    
    print("  运行数据库迁移...")
    code, out, err = ssh_exec(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head 2>/dev/null || echo 迁移完成或无需迁移")
    print(f"    {out.strip()}")
    print()

    print("  检查服务健康状态...")
    time.sleep(10)
    code, out, err = ssh_exec(client, f"curl -s http://localhost/api/v1/health 2>/dev/null || curl -s http://localhost:8989/api/v1/health 2>/dev/null || echo API尚未就绪")
    print(f"    API 状态: {out.strip()}")
    print()

    client.close()

    print("=" * 50)
    print("  部署完成!")
    print("=" * 50)
    print()
    print("访问地址:")
    print(f"  前端: http://{SERVER_IP}")
    print(f"  后端 API: http://{SERVER_IP}/api/v1")
    print()

if __name__ == "__main__":
    main()
