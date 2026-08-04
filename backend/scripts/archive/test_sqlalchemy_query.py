from sqlalchemy import text
from app.core.database import SessionLocal, engine
from app.models.article import Article
from sqlalchemy.orm import joinedload

db = SessionLocal()

try:
    # 1. 执行SQL查询获取article_ids
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
    
    result = db.execute(query, {"limit": 5})
    rows = list(result)
    print(f"SQL query returned {len(rows)} rows")
    
    article_ids = [str(row.id) for row in rows]
    print(f"Article IDs: {article_ids}")
    
    # 2. 使用SQLAlchemy查询
    articles = (
        db.query(Article)
            .options(
                joinedload(Article.author),
                joinedload(Article.categories),
                joinedload(Article.tags)
            )
            .filter(Article.id.in_(article_ids))
            .all()
    )
    
    print(f"SQLAlchemy query returned {len(articles)} articles")
    for article in articles:
        print(f"  - {article.title} (id={article.id})")
    
finally:
    db.close()
