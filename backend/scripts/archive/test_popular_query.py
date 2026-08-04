import psycopg2

conn = psycopg2.connect('postgresql://postgres:123456@localhost:5432/my_awesome_blog')
cur = conn.cursor()

query = """
    SELECT
        a.id,
        COUNT(c.id) as comment_count
    FROM articles a
    LEFT JOIN comments c ON a.id = c.article_id
    WHERE a.is_published = true
    GROUP BY a.id
    ORDER BY a.view_count DESC, COUNT(c.id) DESC, a.published_at DESC
    LIMIT 5
"""

cur.execute(query)
rows = cur.fetchall()

print(f"SQL查询返回 {len(rows)} 行:")
for row in rows:
    print(f"  id: {row[0]}, comment_count: {row[1]}")

conn.close()
