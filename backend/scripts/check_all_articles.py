import psycopg2

conn = psycopg2.connect('postgresql://postgres:123456@localhost:5432/my_awesome_blog')
cur = conn.cursor()

# 检查所有已发布文章
cur.execute("""
    SELECT a.id, a.title, a.author_id, u.id as user_exists
    FROM articles a
    LEFT JOIN users u ON a.author_id = u.id
    WHERE a.is_published = true
    ORDER BY a.view_count DESC
    LIMIT 10
""")

print("已发布文章及作者状态:")
for row in cur.fetchall():
    print(f"  {row[1]}")
    print(f"    article_id: {row[0]}")
    print(f"    author_id: {row[2]}, user_exists: {row[3] is not None}")
    if row[3] is None:
        print(f"    *** 作者不存在！")
    print()

conn.close()
