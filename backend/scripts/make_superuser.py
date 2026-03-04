import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app import crud

def main():
    db = SessionLocal()
    try:
        users = crud.get_users(db, skip=0, limit=10)
        print(f"Found {len(users)} users:")
        for user in users:
            print(f"  - {user.username} (email: {user.email}, is_superuser: {user.is_superuser})")
        
        if len(users) == 0:
            print("No users found!")
            return
        
        first_user = users[0]
        if not first_user.is_superuser:
            print(f"\nMaking {first_user.username} a superuser...")
            first_user.is_superuser = True
            db.commit()
            print(f"✓ {first_user.username} is now a superuser")
        else:
            print(f"\n{first_user.username} is already a superuser")
    finally:
        db.close()

if __name__ == "__main__":
    main()
