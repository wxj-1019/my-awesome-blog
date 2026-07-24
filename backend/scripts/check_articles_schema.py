import psycopg2

conn = psycopg2.connect('postgresql://postgres:123456@localhost:5432/my_awesome_blog')
cur = conn.cursor()

cur.execute("""
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'articles'
    ORDER BY ordinal_position
""")
columns = cur.fetchall()

print("Articles 表结构:")
for col in columns:
    print(f"  {col[0]}: {col[1]}")

conn.close()
