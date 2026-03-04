import sys
sys.path.insert(0, 'E:\\A_Project\\my-awesome-blog\\backend')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def main():
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT id, username, email, is_superuser FROM users LIMIT 5"))
        users = result.fetchall()
        print(f"Found {len(users)} users:")
        for user in users:
            print(f"  - {user[1]} (email: {user[2]}, is_superuser: {user[3]})")
        
        if len(users) == 0:
            print("No users found!")
            return
        
        first_user = users[0]
        if not first_user[3]:
            print(f"\nMaking {first_user[1]} a superuser...")
            db.execute(text(f"UPDATE users SET is_superuser = true WHERE id = '{first_user[0]}'"))
            db.commit()
            print(f"✓ {first_user[1]} is now a superuser")
        else:
            print(f"\n{first_user[1]} is already a superuser")
    finally:
        db.close()

if __name__ == "__main__":
    main()
