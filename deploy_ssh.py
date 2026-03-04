import subprocess
import sys
import time
import os

SERVER_IP = "49.234.190.85"
SERVER_USER = "root"
SERVER_PASS = "zenjiroqQ+"
DEPLOY_PATH = "/opt/my-awesome-blog"
PROJECT_DIR = r"E:\A_Project\my-awesome-blog"

def run_local(cmd, cwd=None):
    print(f"  执行: {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd or PROJECT_DIR, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  错误: {result.stderr}")
    return result.returncode, result.stdout, result.stderr

def ssh_command(cmd):
    full_cmd = f'sshpass -p "{SERVER_PASS}" ssh -o StrictHostKeyChecking=no {SERVER_USER}@{SERVER_IP} "{cmd}"'
    return run_local(full_cmd)

def scp_upload(src, dst):
    full_cmd = f'sshpass -p "{SERVER_PASS}" scp -o StrictHostKeyChecking=no -r {src} {SERVER_USER}@{SERVER_IP}:{dst}'
    return run_local(full_cmd)

def main():
    print("=" * 50)
    print("  My Awesome Blog - 部署脚本")
    print("=" * 50)
    print()

    os.chdir(PROJECT_DIR)

    print("步骤 1/5: 测试 SSH 连接...")
    code, out, err = ssh_command("echo SSH_CONNECTED && docker --version")
    if code != 0:
        print(f"  SSH 连接失败: {err}")
        print("  尝试使用原生方式...")
        return
    print(f"  {out.strip()}")
    print("  SSH 连接成功!")
    print()

    print("步骤 2/5: 创建远程目录...")
    ssh_command(f"mkdir -p {DEPLOY_PATH}/nginx")
    print("  目录创建完成!")
    print()

    print("步骤 3/5: 上传配置文件...")
    
    files_to_upload = [
        ("docker-compose.prod.yml", f"{DEPLOY_PATH}/"),
        (".env.production", f"{DEPLOY_PATH}/"),
        ("nginx/nginx.conf", f"{DEPLOY_PATH}/nginx/"),
    ]
    
    for src, dst in files_to_upload:
        print(f"  上传 {src}...")
        scp_upload(src, dst)
    
    print("  上传 backend 目录...")
    scp_upload("backend", f"{DEPLOY_PATH}/")
    
    print("  上传 frontend 目录...")
    scp_upload("frontend", f"{DEPLOY_PATH}/")
    
    print("  文件上传完成!")
    print()

    print("步骤 4/5: 构建并启动服务...")
    build_cmd = f"cd {DEPLOY_PATH} && cp .env.production .env && docker compose -f docker-compose.prod.yml build --no-cache"
    print("  构建镜像中（这可能需要几分钟）...")
    code, out, err = ssh_command(build_cmd)
    if code != 0:
        print(f"  构建错误: {err}")
    
    print("  启动服务...")
    ssh_command(f"cd {DEPLOY_PATH} && docker compose -f docker-compose.prod.yml up -d")
    print()

    print("步骤 5/5: 等待服务启动并检查状态...")
    time.sleep(15)
    
    code, out, err = ssh_command(f"docker compose -f {DEPLOY_PATH}/docker-compose.prod.yml ps")
    print(out)
    print()

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
