import sys
import os
from pathlib import Path

script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
sys.path.insert(0, backend_dir)

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.security import get_password_hash

def reset_admin_password(new_password: str = "admin123"):
    """重置 admin 用户的密码"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, username FROM users WHERE username = 'admin'"))
        user = result.fetchone()
        
        if not user:
            print("未找到 admin 用户！")
            return False
        
        user_id = user[0]
        username = user[1]
        
        hashed_password = get_password_hash(new_password)
        
        conn.execute(
            text("UPDATE users SET hashed_password = :hashed_password WHERE id = :user_id"),
            {"hashed_password": hashed_password, "user_id": user_id}
        )
        conn.commit()
        
        print(f"✓ 用户 {username} 的密码已重置！")
        print(f"  用户名: {username}")
        print(f"  新密码: {new_password}")
        print(f"\n请使用以下凭据登录:")
        print(f"  用户名: admin")
        print(f"  密码: {new_password}")
        
        return True

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="重置 admin 用户密码")
    parser.add_argument("--password", "-p", default="admin123", help="新密码 (默认: admin123)")
    args = parser.parse_args()
    
    reset_admin_password(args.password)
