"""
异步数据库模块 - SQLAlchemy 2.0 异步模式
"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Convert PostgreSQL URL to async version
def get_async_database_url():
    """将同步数据库URL转换为异步版本"""
    url = settings.DATABASE_URL
    if url.startswith('postgresql://'):
        return url.replace('postgresql://', 'postgresql+asyncpg://', 1)
    elif url.startswith('sqlite://'):
        return url.replace('sqlite://', 'sqlite+aiosqlite://', 1)
    return url

# Create async SQLAlchemy engine with optimized connection pooling
async_database_url = get_async_database_url()

if async_database_url.startswith('postgresql+asyncpg://'):
    # PostgreSQL async specific settings
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    
    async_engine = create_async_engine(
        async_database_url,
        pool_pre_ping=True,
        echo=settings.DEBUG,
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        pool_recycle=settings.DATABASE_POOL_RECYCLE,
        pool_timeout=settings.DATABASE_POOL_TIMEOUT,
        pool_reset_on_return='commit',
        connect_args={
            "timeout": 10,
            "server_settings": {
                "application_name": "MyAwesomeBlog",
                "client_encoding": "UTF8"
            }
        }
    )
else:
    # SQLite async settings (for development/testing)
    async_engine = create_async_engine(
        async_database_url,
        pool_pre_ping=True,
        echo=settings.DEBUG,
        connect_args={"check_same_thread": False} if 'sqlite' in async_database_url else {}
    )

# Create AsyncSession class
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)

# Create Base class for models (shared with sync)
from app.core.database import Base


# Dependency to get async DB session
async def get_async_db():
    """
    获取异步数据库会话的依赖函数
    
    Usage:
        @app.get("/items")
        async def get_items(db: AsyncSession = Depends(get_async_db)):
            result = await db.execute(select(Item))
            return result.scalars().all()
    """
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()
