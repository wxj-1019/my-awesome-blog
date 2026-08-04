import psycopg2

conn = psycopg2.connect('postgresql://postgres:123456@localhost:5432/my_awesome_blog')
cur = conn.cursor()

cur.execute("""
    SELECT id, title, is_published, is_featured, published_at, created_at
    FROM articles
    ORDER BY created_at DESC
    LIMIT 5
""")

print("最近5篇文章的状态:")
for row in cur.fetchall():
    print(f"  {row[1]}")
    print(f"    is_published: {row[2]}, is_featured: {row[3]}")
    print(f"    published_at: {row[4]}, created_at: {row[5]}")
    print()

conn.close()
