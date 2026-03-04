import sys
sys.path.insert(0, 'E:\\A_Project\\my-awesome-blog\\backend')

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def main():
    db = SessionLocal()
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"Database tables: {', '.join(tables)}")
        
        if 'audit_logs' in tables:
            print(f"\n✓ audit_logs table exists")
            
            result = db.execute(text("SELECT COUNT(*) FROM audit_logs"))
            count = result.fetchone()[0]
            print(f"  Total audit logs: {count}")
            
            if count > 0:
                result = db.execute(text("SELECT * FROM audit_logs LIMIT 5"))
                logs = result.fetchall()
                print(f"\n  Recent audit logs:")
                for log in logs:
                    print(f"    - {log[3]}: {log[4]} ({log[1]})")
            else:
                print(f"  No audit logs found")
        else:
            print(f"\n✗ audit_logs table does NOT exist")
            print(f"  You may need to run migrations")
    finally:
        db.close()

if __name__ == "__main__":
    main()
