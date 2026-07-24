from app.core.database import SessionLocal
from app.utils.db_utils import get_popular_articles_optimized

db = SessionLocal()

try:
    articles = get_popular_articles_optimized(db, limit=5, days=30)
    print(f"Backend function returned {len(articles)} articles")
    for article in articles:
        print(f"  - {article.title} (id={article.id})")
finally:
    db.close()
