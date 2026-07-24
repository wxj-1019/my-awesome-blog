import psycopg2

conn = psycopg2.connect('postgresql://postgres:123456@localhost:5432/my_awesome_blog')
cur = conn.cursor()

cur.execute("""
    SELECT id, title, is_published, is_featured, published_at, created_at
    FROM articles
    WHERE is_published = true
    ORDER BY created_at DESC
    LIMIT 5
""")

print("使用 is_published = true 查询:")
for row in cur.fetchall():
    print(f"  {row[1]}")
    print(f"    is_published type: {type(row[2])}, value: {row[2]}")
    print(f"    is_featured type: {type(row[3])}, value: {row[3]}")
    print(f"    published_at: {row[4]}, created_at: {row[5]}")
    print()

cur.execute("""
    SELECT id, title, is_published, is_featured, published_at, created_at
    FROM articles
    WHERE is_published = 'true'
    ORDER BY created_at DESC
    LIMIT 5
""")

print("使用 is_published = 'true' 查询:")
for row in cur.fetchall():
    print(f"  {row[1]}")

conn.close()
