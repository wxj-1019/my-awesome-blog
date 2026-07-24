import psycopg2

conn = psycopg2.connect('postgresql://postgres:123456@localhost:5432/my_awesome_blog')
cur = conn.cursor()

cur.execute("""
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'tenants'
    )
""")
tenants_exists = cur.fetchone()[0]

if not tenants_exists:
    print('Creating tenants table...')
    cur.execute("""
        CREATE TABLE tenants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            max_users INTEGER DEFAULT 1000,
            max_conversations INTEGER DEFAULT 10000,
            max_storage_mb INTEGER DEFAULT 10240,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE
        )
    """)
    print('tenants table created!')

cur.execute("""
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'tenant_id'
""")
result = cur.fetchone()
print('tenant_id exists:', result is not None)

if result is None:
    print('Adding tenant_id column to users table...')
    cur.execute("ALTER TABLE users ADD COLUMN tenant_id UUID")
    cur.execute("""
        INSERT INTO tenants (id, name, slug, description, is_active, max_users, max_conversations, max_storage_mb)
        VALUES (
            '00000000-0000-0000-0000-000000000001',
            'Default Tenant',
            'default',
            'Default tenant for existing users',
            true,
            1000,
            10000,
            10240
        )
    """)
    cur.execute("UPDATE users SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL")
    cur.execute("ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL")
    cur.execute("ALTER TABLE users ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE")
    cur.execute("CREATE INDEX idx_user_tenant ON users(tenant_id)")
    conn.commit()
    print('Done!')
else:
    print('tenant_id column already exists')

conn.close()
