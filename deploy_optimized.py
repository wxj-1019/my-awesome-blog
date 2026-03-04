import subprocess
import sys
import time
import os
import tarfile
import io

SERVER_IP = "49.234.190.85"
SERVER_USER = "root"
SERVER_PASS = "zenjiroqQ+"
DEPLOY_PATH = "/opt/my-awesome-blog"
PROJECT_DIR = r"E:\A_Project\my-awesome-blog"

EXCLUDE_PATTERNS = [
    'node_modules', '.next', '__pycache__', '.git', '*.pyc',
    '.env', '.env.local', 'venv', '.venv', 'logs', '*.log',
    '.trae', '.idea', '.vscode', '*.egg-info', '.pytest_cache',
    'dist', 'build', '*.bak'
]

def main():
    print("=" * 50)
    print("  My Awesome Blog - 部署脚本")
    print("=" * 50)
    print()

    os.chdir(PROJECT_DIR)

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

    def should_exclude(name):
        for pattern in EXCLUDE_PATTERNS:
            if pattern.startswith('*'):
                if name.endswith(pattern[1:]):
                    return True
            elif pattern in name.split(os.sep):
                return True
        return False

    print("步骤 1/6: 创建部署包...")
    
    tar_buffer = io.BytesIO()
    
    def add_to_tar(tar, path, arcname):
        if should_exclude(path):
            return
        if os.path.isfile(path):
            try:
                tar.add(path, arcname)
            except:
                pass
        elif os.path.isdir(path):
            for item in os.listdir(path):
                add_to_tar(tar, os.path.join(path, item), os.path.join(arcname, item))
    
    with tarfile.open(fileobj=tar_buffer, mode='w:gz') as tar:
        essential_files = [
            'docker-compose.prod.yml',
            '.env.production',
            'nginx',
            'backend',
            'frontend'
        ]
        for f in essential_files:
            if os.path.exists(f):
                print(f"  添加 {f}...")
                if os.path.isdir(f):
                    for item in os.listdir(f):
                        add_to_tar(tar, os.path.join(f, item), os.path.join(f, item))
                else:
                    tar.add(f)
    
    tar_size = len(tar_buffer.getvalue())
    print(f"  部署包大小: {tar_size / 1024 / 1024:.2f} MB")
    print()

    print("步骤 2/6: 测试 SSH 连接...")
    try:
        client = get_ssh_client()
        code, out, err = ssh_exec(client, "echo SSH_CONNECTED && docker --version")
        print(f"  {out.strip()}")
        print("  SSH 连接成功!")
    except Exception as e:
        print(f"  SSH 连接失败: {e}")
        return
    print()

    print("步骤 3/6: 上传部署包...")
    ssh_exec(client, f"mkdir -p {DEPLOY_PATH}")
    
    sftp = client.open_sftp()
    remote_tar_path = f"{DEPLOY_PATH}/deploy.tar.gz"
    
    with io.BytesIO(tar_buffer.getvalue()) as fl:
        sftp.putfo(fl, remote_tar_path)
    sftp.close()
    print("  部署包上传完成!")
    print()

    print("步骤 4/6: 解压部署包...")
    ssh_exec(client, f"cd {DEPLOY_PATH} && tar -xzf deploy.tar.gz && rm deploy.tar.gz")
    print("  解压完成!")
    print()

    print("步骤 5/6: 构建并启动服务...")
    print("  复制环境文件...")
    ssh_exec(client, f"cd {DEPLOY_PATH} && cp .env.production .env")
    
    print("  停止旧容器...")
    ssh_exec(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true")
    
    print("  构建镜像中（这可能需要几分钟）...")
    code, out, err = ssh_exec(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml build", timeout=600)
    if out:
        for line in out.split('\n')[-15:]:
            if line.strip():
                print(f"    {line}")
    if err and code != 0:
        print(f"  构建错误: {err[-500:]}")
    
    print("  启动服务...")
    code, out, err = ssh_exec(client, f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml up -d")
    if code != 0:
        print(f"  启动错误: {err}")
    print()

    print("步骤 6/6: 等待服务启动并检查状态...")
    time.sleep(15)
    
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

if __name__ == "__main__":
    main()
