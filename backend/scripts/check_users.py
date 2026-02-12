import sys
import os
from pathlib import Path

script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
sys.path.insert(0, backend_dir)

from sqlalchemy import create_engine, text
from app.core.config import settings

def check_users():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT username, email, is_active, is_superuser FROM users ORDER BY username"))
        users = result.fetchall()
        
        if users:
            print(f"数据库中共有 {len(users)} 个用户:")
            print("-" * 80)
            print(f"{'用户名':<20} {'邮箱':<35} {'活跃':<8} {'管理员':<8}")
            print("-" * 80)
            for user in users:
                username, email, is_active, is_superuser = user
                print(f"{username:<20} {email:<35} {'是' if is_active else '否':<8} {'是' if is_superuser else '否':<8}")
            print("-" * 80)
        else:
            print("数据库中没有用户！")
            print("\n可以使用以下命令创建管理员用户:")
            print("  cd backend/scripts/seed")
            print("  python create_admin_user.py")

if __name__ == "__main__":
    check_users()
