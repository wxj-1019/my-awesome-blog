"""
数据库初始化脚本
用于创建所有数据库表和初始数据
"""

import asyncio
import sys
from pathlib import Path
from argparse import ArgumentParser
from typing import Optional
from uuid import UUID

# 添加项目根目录到Python路径
sys.path.insert(0, str(Path(__file__).parent.parent))

import dotenv
from sqlalchemy import inspect, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.database import Base
from app.models.user import User
from app.models.category import Category
from app.models.tag import Tag
from app.models.article import Article, ArticleCategory, ArticleTag
from app.core.security import get_password_hash
from app.utils.logger import app_logger


class DatabaseInitializer:
    def __init__(self, force: bool = False):
        self.force = force
        self.async_db_url = settings.DATABASE_URL.replace('postgresql://', 'postgresql+asyncpg://')
        self.async_engine = create_async_engine(self.async_db_url)
        self.async_session = sessionmaker(
            self.async_engine,
            class_=AsyncSession,
            expire_on_commit=False
        )

    async def check_tables_exist(self) -> bool:
        """检查表是否已存在"""
        try:
            async with self.async_session() as session:
                async with self.async_engine.connect() as conn:
                    inspector = inspect(self.async_engine)
                    tables = await conn.run_sync(inspector.get_table_names)
                    return len(tables) > 0
        except Exception as e:
            app_logger.warning(f"检查表存在时出错: {e}")
            return False

    async def create_tables(self):
        """创建所有数据库表"""
        try:
            async with self.async_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            app_logger.info("数据库表创建成功")
        except Exception as e:
            app_logger.error(f"创建表失败: {e}")
            raise

    async def create_admin_user(self):
        """创建默认管理员用户"""
        try:
            async with self.async_session() as session:
                # 检查是否已存在管理员用户
                result = await session.execute(
                    select(User).where(User.is_superuser == True)
                )
                admin_users = result.scalars().all()

                if admin_users:
                    app_logger.info("管理员用户已存在，跳过创建")
                    return admin_users[0].id

                # 创建默认管理员用户：密码从 INITIAL_ADMIN_PASSWORD 读取；
                # 未配置时生成随机密码（仅打印一次，避免新部署遗留固定弱口令）
                import os as _os
                import secrets as _secrets
                admin_password = _os.getenv("INITIAL_ADMIN_PASSWORD") or _secrets.token_urlsafe(12)
                hashed_password = await get_password_hash(admin_password)
                
                admin_user = User(
                    email="admin@example.com",
                    hashed_password=hashed_password,
                    is_active=True,
                    is_superuser=True,
                    full_name="Admin User",
                    username="admin"
                )

                session.add(admin_user)
                await session.commit()
                await session.refresh(admin_user)

                print("\n" + "="*50)
                print("管理员用户创建成功:")
                print(f"  用户名: admin")
                print(f"  密码: {admin_password}")
                print(f"  邮箱: admin@example.com")
                print(f"  ID: {admin_user.id}")
                print("="*50 + "\n")

                return admin_user.id

        except Exception as e:
            app_logger.error(f"创建管理员用户失败: {e}")
            raise

    async def create_initial_categories(self, admin_user_id: UUID):
        """创建初始分类"""
        try:
            async with self.async_session() as session:
                # 检查是否已有分类
                result = await session.execute(select(Category))
                existing_categories = result.scalars().all()
                
                if existing_categories:
                    app_logger.info(f"已存在 {len(existing_categories)} 个分类，跳过创建")
                    return existing_categories

                categories = [
                    Category(
                        name="技术分享",
                        slug="tech-sharing",
                        description="关于技术的文章和教程",
                        color="#06B6D4",
                        icon="code",
                        sort_order=1
                    ),
                    Category(
                        name="生活随笔",
                        slug="life-essays",
                        description="日常生活的感悟和记录",
                        color="#8B5CF6",
                        icon="pen-tool",
                        sort_order=2
                    ),
                    Category(
                        name="学习笔记",
                        slug="study-notes",
                        description="学习过程中的笔记和总结",
                        color="#10B981",
                        icon="book",
                        sort_order=3
                    ),
                    Category(
                        name="项目展示",
                        slug="portfolio",
                        description="个人项目和作品展示",
                        color="#F59E0B",
                        icon="folder",
                        sort_order=4
                    ),
                    Category(
                        name="旅行日记",
                        slug="travel-diary",
                        description="旅行中的所见所闻",
                        color="#EF4444",
                        icon="map",
                        sort_order=5
                    )
                ]

                for category in categories:
                    session.add(category)

                await session.commit()
                app_logger.info(f"成功创建 {len(categories)} 个初始分类")
                
                return categories

        except Exception as e:
            app_logger.error(f"创建初始分类失败: {e}")
            raise

    async def create_initial_tags(self):
        """创建初始标签"""
        try:
            async with self.async_session() as session:
                # 检查是否已有标签
                result = await session.execute(select(Tag))
                existing_tags = result.scalars().all()
                
                if existing_tags:
                    app_logger.info(f"已存在 {len(existing_tags)} 个标签，跳过创建")
                    return existing_tags

                tags = [
                    Tag(
                        name="Python",
                        slug="python",
                        description="Python编程语言相关内容",
                        color="#3776AB"
                    ),
                    Tag(
                        name="JavaScript",
                        slug="javascript",
                        description="JavaScript编程语言相关内容",
                        color="#F7DF1E"
                    ),
                    Tag(
                        name="数据库",
                        slug="database",
                        description="数据库技术相关内容",
                        color="#003B57"
                    ),
                    Tag(
                        name="React",
                        slug="react",
                        description="React框架相关内容",
                        color="#61DAFB"
                    ),
                    Tag(
                        name="Next.js",
                        slug="nextjs",
                        description="Next.js框架相关内容",
                        color="#000000"
                    ),
                    Tag(
                        name="FastAPI",
                        slug="fastapi",
                        description="FastAPI框架相关内容",
                        color="#009688"
                    ),
                    Tag(
                        name="算法",
                        slug="algorithm",
                        description="算法与数据结构相关内容",
                        color="#FF6B6B"
                    ),
                    Tag(
                        name="DevOps",
                        slug="devops",
                        description="DevOps和运维相关内容",
                        color="#2496ED"
                    ),
                    Tag(
                        name="前端开发",
                        slug="frontend",
                        description="前端开发技术",
                        color="#7C3AED"
                    ),
                    Tag(
                        name="后端开发",
                        slug="backend",
                        description="后端开发技术",
                        color="#059669"
                    )
                ]

                for tag in tags:
                    session.add(tag)

                await session.commit()
                app_logger.info(f"成功创建 {len(tags)} 个初始标签")
                
                return tags

        except Exception as e:
            app_logger.error(f"创建初始标签失败: {e}")
            raise

    async def create_sample_articles(self, admin_user_id: UUID, categories: list, tags: list):
        """创建示例文章"""
        try:
            async with self.async_session() as session:
                # 检查是否已有文章
                result = await session.execute(select(Article))
                existing_articles = result.scalars().all()
                
                if existing_articles:
                    app_logger.info(f"已存在 {len(existing_articles)} 篇文章，跳过创建示例文章")
                    return

                # 创建示例文章
                articles_data = [
                    {
                        "title": "欢迎来到我的博客",
                        "slug": "welcome-to-my-blog",
                        "content": """欢迎来到我的个人博客！这是一个使用 FastAPI + Next.js 构建的现代化博客系统。

在这里，你可以找到：
- 技术文章和教程
- 日常生活随笔
- 学习笔记和总结
- 个人项目展示

希望你能在这里找到有趣的内容，如果你有任何问题或建议，欢迎随时与我联系！""",
                        "excerpt": "欢迎来到我的博客，这里有你想要的技术文章和生活随笔。",
                        "is_published": True,
                        "category_slugs": ["tech-sharing"],
                        "tag_slugs": ["Python", "FastAPI"]
                    },
                    {
                        "title": "如何使用 FastAPI 开发高性能后端",
                        "slug": "getting-started-with-fastapi",
                        "content": """# FastAPI 简介

FastAPI 是一个现代、快速（高性能）的 Web 框架，用于基于 Python 类型提示构建 API。

## 主要特性

- **快速**：可与 NodeJS 和 Go 比肩
- **代码简洁**：减少重复代码
- **自动文档**：基于 OpenAPI 和 JSON Schema
- **类型提示**：充分利用 Python 类型提示
- **编辑器支持**：自动补全和类型检查

## 快速开始

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}
```

## 运行服务

```bash
uvicorn main:app --reload
```

访问 http://localhost:8000/docs 查看 API 文档。""",
                        "excerpt": "FastAPI 是一个现代化的 Web 框架，本文介绍如何快速开始使用 FastAPI 开发后端服务。",
                        "is_published": True,
                        "category_slugs": ["tech-sharing"],
                        "tag_slugs": ["Python", "FastAPI", "后端开发"]
                    },
                    {
                        "title": "React Hooks 最佳实践",
                        "slug": "react-hooks-best-practices",
                        "content": """# React Hooks 最佳实践

React Hooks 让我们可以在函数组件中使用状态和其他 React 特性。

## useState Hook

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}
```

## useEffect Hook

用于处理副作用，如数据获取、订阅等。

```jsx
useEffect(() => {
  fetchData();
}, [dependencies]);
```

## 最佳实践

1. 遵循 Hooks 规则
2. 只在最顶层使用 Hooks
3. 在 React 函数中使用 Hooks
4. 使用自定义 Hooks 复用逻辑

## 自定义 Hooks

```jsx
function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  
  useEffect(() => {
    const handleResize = () => {
      setSize([window.innerWidth, window.innerHeight]);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return size;
}
```""",
                        "excerpt": "本文介绍 React Hooks 的使用方法和最佳实践，包括 useState、useEffect 和自定义 Hooks。",
                        "is_published": True,
                        "category_slugs": ["tech-sharing"],
                        "tag_slugs": ["React", "JavaScript", "前端开发"]
                    },
                    {
                        "title": "数据库索引优化指南",
                        "slug": "database-index-optimization",
                        "content": """# 数据库索引优化指南

索引是数据库优化的关键工具，合理使用索引可以显著提升查询性能。

## 什么时候创建索引？

1. 经常用于 WHERE、JOIN、ORDER BY 的字段
2. 大表上的查询
3. 需要保证唯一性的字段

## 索引类型

### B-Tree 索引
最常用的索引类型，适合范围查询和排序。

### Hash 索引
适合等值查询，但不支持范围查询。

### 复合索引
多个字段组合的索引，可以优化多条件查询。

```sql
CREATE INDEX idx_user_status ON users(status, created_at);
```

## 索引优化建议

1. 不要过度索引：索引会增加写入开销
2. 选择性高的字段适合建索引
3. 定期维护索引
4. 使用 EXPLAIN 分析查询计划

## 监控索引使用情况

定期检查索引的使用效率，删除不常用的索引。""",
                        "excerpt": "数据库索引是性能优化的关键，本文介绍何时创建索引、索引类型和优化建议。",
                        "is_published": True,
                        "category_slugs": ["tech-sharing"],
                        "tag_slugs": ["数据库", "后端开发"]
                    },
                    {
                        "title": "2024年度总结与展望",
                        "slug": "2024-yearly-review",
                        "content": """# 2024 年度总结与展望

## 成就回顾

今年是我技术成长最快的一年，主要成果包括：

### 技术栈扩展
- 深入学习了 FastAPI 和 SQLAlchemy
- 掌握了 Next.js 和 React 的开发
- 实践了 PostgreSQL 的优化技巧

### 项目完成
- 搭建了这个个人博客系统
- 完成了多个小型工具项目
- 参与了开源社区贡献

## 明年计划

### 学习目标
1. 深入学习云原生技术
2. 掌握 Kubernetes 基础
3. 学习 Go 语言

### 项目计划
1. 优化博客系统性能
2. 开发更多实用工具
3. 持续贡献开源项目

## 感悟

技术学习是一个持续的过程，保持好奇心和实践热情最重要。

感谢所有支持和帮助过我的人！""",
                        "excerpt": "2024年已经过去，是时候回顾这一年的成长，并规划明年的目标。",
                        "is_published": True,
                        "category_slugs": ["life-essays"],
                        "tag_slugs": ["Python", "FastAPI"]
                    }
                ]

                # 创建文章并关联分类和标签
                for article_data in articles_data:
                    article = Article(
                        title=article_data["title"],
                        slug=article_data["slug"],
                        content=article_data["content"],
                        excerpt=article_data["excerpt"],
                        is_published=article_data["is_published"],
                        author_id=admin_user_id,
                        is_featured=False,
                        is_pinned=False
                    )

                    # 关联分类
                    for cat_slug in article_data["category_slugs"]:
                        category = next((c for c in categories if c.slug == cat_slug), None)
                        if category:
                            article_category = ArticleCategory(article=article, category=category)
                            session.add(article_category)

                    # 关联标签
                    for tag_slug in article_data["tag_slugs"]:
                        tag = next((t for t in tags if t.slug == tag_slug), None)
                        if tag:
                            article_tag = ArticleTag(article=article, tag=tag)
                            session.add(article_tag)

                    session.add(article)

                await session.commit()
                app_logger.info(f"成功创建 {len(articles_data)} 篇示例文章")

        except Exception as e:
            app_logger.error(f"创建示例文章失败: {e}")
            raise

    async def show_tables(self):
        """显示所有表"""
        try:
            async with self.async_session() as session:
                async with self.async_engine.connect() as conn:
                    inspector = inspect(self.async_engine)
                    tables = await conn.run_sync(inspector.get_table_names)
                    
                    print("\n" + "="*50)
                    print(f"数据库中共有 {len(tables)} 个表:")
                    print("="*50)
                    for table in sorted(tables):
                        print(f"  - {table}")
                    print("="*50 + "\n")
        except Exception as e:
            app_logger.error(f"显示表列表失败: {e}")

    async def show_data_summary(self):
        """显示数据摘要"""
        try:
            async with self.async_session() as session:
                users = (await session.execute(select(User))).scalars().all()
                categories = (await session.execute(select(Category))).scalars().all()
                tags = (await session.execute(select(Tag))).scalars().all()
                articles = (await session.execute(select(Article))).scalars().all()

                print("\n" + "="*50)
                print("数据摘要:")
                print("="*50)
                print(f"  用户数: {len(users)}")
                print(f"  分类数: {len(categories)}")
                print(f"  标签数: {len(tags)}")
                print(f"  文章数: {len(articles)}")
                print("="*50 + "\n")

        except Exception as e:
            app_logger.error(f"显示数据摘要失败: {e}")

    async def initialize(self):
        """执行完整的数据库初始化流程"""
        try:
            # 加载环境变量
            dotenv.load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

            app_logger.info("开始数据库初始化...")

            # 检查表是否已存在
            tables_exist = await self.check_tables_exist()

            if tables_exist and not self.force:
                print("\n" + "="*50)
                print("数据库表已存在！")
                print("="*50)
                await self.show_tables()
                
                response = input("\n是否要重新创建所有表？这将删除所有数据！(yes/no): ").strip().lower()
                if response != 'yes':
                    print("取消初始化。")
                    return

            if tables_exist and self.force:
                print("\n" + "="*50)
                print("强制模式：删除所有表并重新创建")
                print("="*50)
                async with self.async_engine.begin() as conn:
                    await conn.run_sync(Base.metadata.drop_all)
                app_logger.info("已删除所有表")

            # 创建表
            print("\n正在创建数据库表...")
            await self.create_tables()

            # 创建管理员用户
            print("正在创建管理员用户...")
            admin_user_id = await self.create_admin_user()

            # 创建初始分类
            print("正在创建初始分类...")
            categories = await self.create_initial_categories(admin_user_id)

            # 创建初始标签
            print("正在创建初始标签...")
            tags = await self.create_initial_tags()

            # 创建示例文章
            print("正在创建示例文章...")
            await self.create_sample_articles(admin_user_id, categories, tags)

            # 显示所有表
            await self.show_tables()

            # 显示数据摘要
            await self.show_data_summary()

            print("\n" + "="*50)
            print("数据库初始化完成！")
            print("="*50)
            print("\n下一步操作:")
            print("  1. 启动应用: uvicorn app.main:app --reload --host 0.0.0.0 --port 8989")
            print("  2. 访问API文档: http://localhost:8989/docs")
            print("  3. 登录管理后台开始使用")
            print("\n重要提醒:")
            print("  - 请在生产环境中修改默认管理员密码")
            print("  - 数据库连接配置在 .env 文件中\n")

        except Exception as e:
            app_logger.error(f"数据库初始化失败: {e}")
            raise
        finally:
            await self.async_engine.dispose()


async def main():
    """主函数"""
    parser = ArgumentParser(description="数据库初始化脚本")
    parser.add_argument(
        '--force',
        action='store_true',
        help='强制重新创建所有表（将删除所有数据）'
    )
    args = parser.parse_args()

    initializer = DatabaseInitializer(force=args.force)
    await initializer.initialize()


if __name__ == "__main__":
    asyncio.run(main())
