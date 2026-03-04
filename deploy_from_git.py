import subprocess
import sys
import time

SERVER_IP = "49.234.190.85"
SERVER_USER = "root"
SERVER_PASS = "zenjiroqQ+"
DEPLOY_PATH = "/opt/my-awesome-blog"
REPO_URL = "https://github.com/wxj-1019/my-awesome-blog.git"

def main():
    print("=" * 50)
    print("  My Awesome Blog - 部署脚本")
    print("  从 GitHub 仓库拉取并部署")
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

    print("步骤 1/6: 测试 SSH 连接...")
    try:
        client = get_ssh_client()
        code, out, err = ssh_exec(client, "echo SSH_CONNECTED && docker --version && docker compose version")
        print(f"  {out.strip()}")
        print("  SSH 连接成功!")
    except Exception as e:
        print(f"  SSH 连接失败: {e}")
        return
    print()

    print("步骤 2/6: 安装 Git（如果未安装）...")
    code, out, err = ssh_exec(client, "which git || (apt-get update && apt-get install -y git)")
    print("  Git 检查完成!")
    print()

    print("步骤 3/6: 克隆/更新代码仓库...")
    code, out, err = ssh_exec(client, f"test -d {DEPLOY_PATH} && echo EXISTS || echo NOT_EXISTS")
    
    if "EXISTS" in out:
        print("  目录已存在，拉取最新代码...")
        code, out, err = ssh_exec(client, f"cd {DEPLOY_PATH} && git fetch origin && git reset --hard origin/main")
        if code != 0:
            code, out, err = ssh_exec(client, f"cd {DEPLOY_PATH} && git fetch origin && git reset --hard origin/master")
    else:
        print("  克隆代码仓库...")
        code, out, err = ssh_exec(client, f"rm -rf {DEPLOY_PATH} && git clone {REPO_URL} {DEPLOY_PATH}")
    
    if code != 0:
        print(f"  Git 操作错误: {err}")
    else:
        print("  代码更新完成!")
    print()

    print("步骤 4/6: 配置环境变量...")
    env_content = """# 生产环境配置
POSTGRES_USER=postgres
POSTGRES_PASSWORD=aB3kL9xM2pQ7vR5tY8wZ
POSTGRES_DB=my_awesome_blog
SECRET_KEY=f8e2d4b6a1c9e7f3g5h2i8j4k6l0m9n2o1p3q5r7s9t1u2v4w6x8y0z1a3b5c7d9
NEXT_PUBLIC_SITE_URL=http://49.234.190.85
NEXT_PUBLIC_API_BASE_URL=http://49.234.190.85
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
"""
    
    sftp = client.open_sftp()
    with sftp.file(f"{DEPLOY_PATH}/.env.production", 'w') as f:
        f.write(env_content)
    sftp.close()
    print("  环境变量配置完成!")
    print()

    print("步骤 5/6: 构建并启动服务...")
    print("  复制环境文件...")
    ssh_exec(client, f"cd {DEPLOY_PATH} && cp .env.production .env")
    
    print("  停止旧容器...")
    ssh_exec(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true")
    
    print("  清理旧镜像...")
    ssh_exec(client, "docker image prune -f")
    
    print("  构建镜像中（这可能需要几分钟）...")
    print("  请耐心等待...")
    code, out, err = ssh_exec(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml build", timeout=600)
    if out:
        for line in out.split('\n')[-20:]:
            if line.strip():
                print(f"    {line}")
    if err and code != 0:
        print(f"  构建错误: {err[-500:]}")
    print()
    
    print("  启动服务...")
    code, out, err = ssh_exec(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml up -d")
    if code != 0:
        print(f"  启动错误: {err}")
    print()

    print("步骤 6/6: 等待服务启动并检查状态...")
    time.sleep(20)
    
    print("  容器状态:")
    code, out, err = ssh_exec(client, f"docker compose -f {DEPLOY_PATH}/docker-compose.prod.yml ps")
    print(out)
    
    print("  运行数据库迁移...")
    code, out, err = ssh_exec(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head 2>/dev/null || echo 迁移完成或无需迁移")
    print(f"    {out.strip()}")
    print()

    print("  检查服务健康状态...")
    code, out, err = ssh_exec(client, f"curl -s http://localhost/api/v1/health 2>/dev/null || echo API尚未就绪")
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
    print("常用命令:")
    print(f"  查看日志: ssh root@{SERVER_IP} 'docker compose -f {DEPLOY_PATH}/docker-compose.prod.yml logs -f'")
    print(f"  重启服务: ssh root@{SERVER_IP} 'docker compose -f {DEPLOY_PATH}/docker-compose.prod.yml restart'")
    print(f"  停止服务: ssh root@{SERVER_IP} 'docker compose -f {DEPLOY_PATH}/docker-compose.prod.yml down'")
    print()

if __name__ == "__main__":
    main()
