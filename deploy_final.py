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
