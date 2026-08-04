from sqlalchemy import text
from app.core.database import SessionLocal
from app.models.article import Article
from app.models.user import User
from sqlalchemy.orm import joinedload

db = SessionLocal()

try:
    # 检查users表中是否有数据
    user_count = db.query(User).count()
    print(f"Total users in database: {user_count}")
    
    users = db.query(User).limit(3).all()
    print(f"First {len(users)} users:")
    for user in users:
        print(f"  - {user.username} (id={user.id})")
    
    # 检查articles表
    article_count = db.query(Article).count()
    print(f"\nTotal articles in database: {article_count}")
    
    # 执行原始SQL查询
    query = text("""
        SELECT
            a.id,
            COUNT(c.id) as comment_count
        FROM articles a
        LEFT JOIN comments c ON a.id = c.article_id
        WHERE a.is_published = true
        GROUP BY a.id
        ORDER BY a.view_count DESC, COUNT(c.id) DESC, a.published_at DESC
        LIMIT :limit
    """)
    
    result = db.execute(query, {"limit": 10})
    rows = list(result)
    print(f"\nSQL query returned {len(rows)} rows")
    
    for i, row in enumerate(rows[:5], 1):
        print(f"  {i}. Article ID: {row.id}")
    
finally:
    db.close()
