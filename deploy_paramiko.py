import subprocess
import sys
import time
import os
import paramiko
from scp import SCPClient

SERVER_IP = "49.234.190.85"
SERVER_USER = "root"
SERVER_PASS = "zenjiroqQ+"
DEPLOY_PATH = "/opt/my-awesome-blog"
PROJECT_DIR = r"E:\A_Project\my-awesome-blog"

def get_ssh_client():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    return client

def ssh_command(client, cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=300)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    return stdout.channel.recv_exit_status(), out, err

def main():
    print("=" * 50)
    print("  My Awesome Blog - 部署脚本")
    print("=" * 50)
    print()

    try:
        import paramiko
        from scp import SCPClient
    except ImportError:
        print("正在安装必要的依赖...")
        subprocess.run([sys.executable, "-m", "pip", "install", "paramiko", "scp"], check=True)
        import paramiko
        from scp import SCPClient

    os.chdir(PROJECT_DIR)

    print("步骤 1/5: 测试 SSH 连接...")
    try:
        client = get_ssh_client()
        code, out, err = ssh_command(client, "echo SSH_CONNECTED && docker --version")
        print(f"  {out.strip()}")
        print("  SSH 连接成功!")
    except Exception as e:
        print(f"  SSH 连接失败: {e}")
        return
    print()

    print("步骤 2/5: 创建远程目录...")
    ssh_command(client, f"mkdir -p {DEPLOY_PATH}/nginx")
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
        
        print("  上传 backend 目录...")
        scp.put("backend", f"{DEPLOY_PATH}/", recursive=True)
        
        print("  上传 frontend 目录...")
        scp.put("frontend", f"{DEPLOY_PATH}/", recursive=True)
    
    print("  文件上传完成!")
    print()

    print("步骤 4/5: 构建并启动服务...")
    print("  复制环境文件...")
    ssh_command(client, f"cd {DEPLOY_PATH} && cp .env.production .env")
    
    print("  构建镜像中（这可能需要几分钟）...")
    code, out, err = ssh_command(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml build --no-cache")
    if code != 0:
        print(f"  构建警告/错误: {err[-500:] if len(err) > 500 else err}")
    
    print("  启动服务...")
    code, out, err = ssh_command(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml up -d")
    if code != 0:
        print(f"  启动错误: {err}")
    print()

    print("步骤 5/5: 等待服务启动并检查状态...")
    time.sleep(15)
    
    code, out, err = ssh_command(client, f"docker compose -f {DEPLOY_PATH}/docker-compose.prod.yml ps")
    print(out)
    print()

    client.close()

    print("=" * 50)
    print("  部署完成!")
    print("=" * 50)
    print()
    print("访问地址:")
    print(f"  前端: http://{SERVER_IP}")
    print(f"  API 文档: http://{SERVER_IP}/docs")
    print()

if __name__ == "__main__":
    main()
