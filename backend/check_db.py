"""检查数据库连接"""
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 检查数据库URL
db_url = os.getenv('DATABASE_URL')
print(f"Database URL configured: {db_url is not None}")
if db_url:
    print(f"Database URL: {db_url[:30]}...")

# 尝试连接数据库
try:
    import psycopg2
    print("\nTesting database connection...")
    conn = psycopg2.connect(db_url)
    print("Database connection: SUCCESS")
    conn.close()
except Exception as e:
    print(f"Database connection: FAILED - {e}")

# 检查alembic
try:
    from app.utils.alembic_runner import AlembicRunner
    print("\nAlembic import: SUCCESS")
    runner = AlembicRunner()
    print("Alembic config: SUCCESS")
except Exception as e:
    print(f"Alembic error: {e}")
