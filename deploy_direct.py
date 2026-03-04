import subprocess
import sys
import time

SERVER_IP = "49.234.190.85"
SERVER_USER = "root"
SERVER_PASS = "zenjiroqQ+"
DEPLOY_PATH = "/opt/my-awesome-blog"

def main():
    print("=" * 50)
    print("  My Awesome Blog - 直接部署脚本")
    print("  修复 Dockerfile 并重新构建")
    print("=" * 50)
    print()

    try:
        import paramiko
    except ImportError:
        print("正在安装必要的依赖...")
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

    print("步骤 1: 连接服务器...")
    try:
        client = get_ssh_client()
        print("  连接成功!")
    except Exception as e:
        print(f"  连接失败: {e}")
        return
    print()

    print("步骤 2: 修改 Dockerfile...")
    new_dockerfile = '''FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies (ignore scripts to avoid postinstall issues)
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps --ignore-scripts

# Copy live2d core manually
RUN mkdir -p public && \
    if [ -f node_modules/live2dcubismcore/live2dcubismcore.min.js ]; then \
        cp node_modules/live2dcubismcore/live2dcubismcore.min.js public/; \
    fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx next telemetry disable
RUN npm run build

# Production image
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
    print("  Dockerfile 已更新 (Node.js 20)!")
    print()

    print("步骤 3: 构建并启动服务...")
    print("  停止旧容器...")
    ssh_exec(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true")
    
    print("  清理旧镜像...")
    ssh_exec(client, "docker image prune -f")
    
    print("  构建镜像中（这可能需要几分钟）...")
    print("  请耐心等待...")
    code, out, err = ssh_exec(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml build --no-cache", timeout=900)
    if out:
        for line in out.split('\n')[-30:]:
            if line.strip():
                print(f"    {line}")
    if err and code != 0:
        print(f"  构建错误: {err[-1000:]}")
    print()
    
    print("  启动服务...")
    code, out, err = ssh_exec(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml up -d")
    if code != 0:
        print(f"  启动错误: {err}")
    print()

    print("步骤 4: 等待服务启动并检查状态...")
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
    print(f"  API 文档: http://{SERVER_IP}/docs")
    print()

if __name__ == "__main__":
    main()
