import psycopg2

conn = psycopg2.connect('postgresql://postgres:123456@localhost:5432/my_awesome_blog')
cur = conn.cursor()

article_ids = ['0319af53-b9c6-4b7d-af1c-d937b67b6073', '190492f3-7314-442b-a9b7-4228d161e0bc', '97499de0-bb59-4097-9a22-2d25cde9dc36', '9b31ca7a-d87a-4628-a2b2-9b5ef0ce1c76', 'ecfdbabf-3436-4716-9c6d-98691e3f02dc']

for article_id in article_ids:
    cur.execute("SELECT id, title, author_id FROM articles WHERE id = %s", (article_id,))
    row = cur.fetchone()
    if row:
        print(f"{row[1]}: author_id={row[2]}")
    else:
        print(f"Article not found: {article_id}")

conn.close()
