import psycopg2
from datetime import datetime, timedelta
import uuid

conn = psycopg2.connect('postgresql://postgres:123456@localhost:5432/my_awesome_blog')
cur = conn.cursor()

# 获取用户ID
cur.execute("SELECT id FROM users LIMIT 1")
user_result = cur.fetchone()
if not user_result:
    print("没有找到用户，请先注册一个用户")
    conn.close()
    exit(1)

user_id = user_result[0]
print(f"使用用户ID: {user_id}")

# 清理旧数据
cur.execute("DELETE FROM article_categories WHERE article_id IN (SELECT id FROM articles WHERE slug IN (%s, %s, %s, %s, %s, %s))", (
    'react-hooks-deep-dive', 'nextjs-14-complete-guide', 'typescript-advanced-tips',
    'postgresql-performance-optimization', 'docker-containerization-guide', 'redis-cache-strategies'
))
cur.execute("DELETE FROM article_tags WHERE article_id IN (SELECT id FROM articles WHERE slug IN (%s, %s, %s, %s, %s, %s))", (
    'react-hooks-deep-dive', 'nextjs-14-complete-guide', 'typescript-advanced-tips',
    'postgresql-performance-optimization', 'docker-containerization-guide', 'redis-cache-strategies'
))
cur.execute("DELETE FROM articles WHERE slug IN (%s, %s, %s, %s, %s, %s)", (
    'react-hooks-deep-dive', 'nextjs-14-complete-guide', 'typescript-advanced-tips',
    'postgresql-performance-optimization', 'docker-containerization-guide', 'redis-cache-strategies'
))
conn.commit()
print("清理旧数据完成")

# 创建测试文章
test_articles = [
    {
        "title": "深入理解React Hooks的工作原理",
        "slug": "react-hooks-deep-dive",
        "content": """React Hooks是React 16.8引入的新特性，它允许你在不编写class的情况下使用state以及其他的React特性。本文将深入探讨Hooks的工作原理，包括useState、useEffect等核心Hook的实现机制。

## useState的工作原理

useState是React中最基础的Hook之一。当你调用useState时，React会为你创建一个状态变量，并将其存储在组件对应的Fiber节点中。每次组件重新渲染时，React会按照相同的顺序读取这些状态值。

```javascript
const [count, setCount] = useState(0);
```

在React内部，useState会创建一个Hook对象，其中包含了状态的当前值和更新函数。当调用setCount时，React会调度一次更新，在下次渲染时使用新的状态值。

## useEffect的依赖追踪

useEffect用于处理副作用，如数据获取、订阅、DOM操作等。它的第二个参数是依赖数组，React会比较数组中的值是否发生变化来决定是否重新执行effect。

## 自定义Hooks

自定义Hooks让你能够提取组件逻辑到可重用的函数中。遵循"use"开头的命名约定，自定义Hooks可以调用其他Hooks，实现逻辑的复用和组合。""",
        "excerpt": "深入探讨React Hooks的工作原理，包括useState、useEffect等核心Hook的实现机制。",
        "is_published": True,
        "is_featured": True,
        "is_pinned": False,
        "view_count": 1520,
        "read_time": 10,
        "created_at": datetime.now() - timedelta(days=3)
    },
    {
        "title": "Next.js 14全攻略：App Router与Server Components",
        "slug": "nextjs-14-complete-guide",
        "content": """Next.js 14带来了革命性的变化，特别是App Router和Server Components的引入。本文将全面介绍这些新特性以及如何在实际项目中应用它们。

## App Router架构

App Router采用了新的文件系统路由，基于React Server Components。这意味着默认情况下，组件在服务器端渲染，可以减少客户端JavaScript的体积。

## Server Components的优势

Server Components可以直接访问数据库、API和文件系统，无需额外的API层。这简化了数据获取逻辑，提高了应用的性能。

## 客户端组件与服务器端组件

通过'use client'指令，你可以明确指定哪些组件需要在客户端渲染。这种混合模式让你能够在需要交互性的地方使用客户端组件，在其他地方享受服务器端组件的优势。""",
        "excerpt": "全面介绍Next.js 14的App Router和Server Components新特性。",
        "is_published": True,
        "is_featured": True,
        "is_pinned": False,
        "view_count": 2340,
        "read_time": 12,
        "created_at": datetime.now() - timedelta(days=7)
    },
    {
        "title": "TypeScript高级类型技巧：提升代码质量",
        "slug": "typescript-advanced-tips",
        "content": """TypeScript为JavaScript带来了静态类型检查，但掌握高级类型技巧可以显著提升代码质量和开发效率。本文分享一些实用的TypeScript高级类型技巧。

## 泛型约束

泛型约束允许你限制泛型参数的类型范围，使类型更加精确和安全。

```typescript
interface HasLength {
    length: number;
}

function logLength<T extends HasLength>(arg: T): void {
    console.log(arg.length);
}
```

## 条件类型

条件类型根据类型关系选择不同的类型，这是TypeScript中非常强大的特性。

## 映射类型

映射类型可以基于一个类型创建新类型，常用的Partial、Required、Pick、Omit等都是映射类型的例子。""",
        "excerpt": "分享实用的TypeScript高级类型技巧，包括泛型约束、条件类型、映射类型等。",
        "is_published": True,
        "is_featured": True,
        "is_pinned": False,
        "view_count": 980,
        "read_time": 8,
        "created_at": datetime.now() - timedelta(days=10)
    },
    {
        "title": "PostgreSQL性能优化实战：索引与查询优化",
        "slug": "postgresql-performance-optimization",
        "content": """PostgreSQL是一个功能强大的开源关系数据库系统。本文将介绍一些实用的性能优化技巧，帮助你在实际项目中提升数据库性能。

## 索引策略

正确的索引设计是数据库性能优化的关键。需要根据查询模式选择合适的索引类型，包括B-tree、Hash、GiST、SP-GiST等。

## 查询优化

使用EXPLAIN ANALYZE分析查询执行计划，识别性能瓶颈。优化WHERE子句、JOIN顺序、子查询等都可以显著提升查询性能。

## 数据库配置优化

合理的内存配置、连接池设置、工作内存参数等都会影响数据库的整体性能。需要根据服务器硬件和应用特点进行调优。""",
        "excerpt": "介绍PostgreSQL性能优化技巧，包括索引策略、查询优化和数据库配置优化。",
        "is_published": True,
        "is_featured": False,
        "is_pinned": True,
        "view_count": 3200,
        "read_time": 15,
        "created_at": datetime.now() - timedelta(days=14)
    },
    {
        "title": "Docker容器化部署：从零开始构建生产级应用",
        "slug": "docker-containerization-guide",
        "content": """Docker已经成为现代应用部署的标准工具。本文将带你从零开始，使用Docker容器化部署一个生产级应用。

## Docker基础概念

了解Docker的核心概念：镜像、容器、仓库。掌握Dockerfile的编写技巧，创建优化的镜像。

## 多容器应用编排

使用Docker Compose编排多个容器，实现应用与数据库、缓存等服务的协同工作。

## 生产环境最佳实践

包括镜像优化、安全配置、资源限制、日志管理、监控告警等生产环境部署的关键要点。""",
        "excerpt": "从零开始使用Docker容器化部署生产级应用的最佳实践。",
        "is_published": True,
        "is_featured": False,
        "is_pinned": False,
        "view_count": 1450,
        "read_time": 11,
        "created_at": datetime.now() - timedelta(days=21)
    },
    {
        "title": "Redis缓存策略设计：提升应用性能",
        "slug": "redis-cache-strategies",
        "content": """Redis是一个高性能的内存数据库，常用于缓存、会话存储、消息队列等场景。本文将介绍如何设计高效的Redis缓存策略。

## 缓存模式

了解常见的缓存模式：Cache Aside、Read Through、Write Through、Write Behind等，以及它们适用的场景。

## 缓存失效策略

设计合理的缓存失效策略，包括TTL过期、主动失效、版本控制等方法。

## Redis数据结构选择

根据不同的使用场景选择合适的Redis数据结构：String、Hash、List、Set、Sorted Set等。""",
        "excerpt": "介绍Redis缓存策略设计，包括缓存模式、失效策略和数据结构选择。",
        "is_published": True,
        "is_featured": False,
        "is_pinned": False,
        "view_count": 1890,
        "read_time": 9,
        "created_at": datetime.now() - timedelta(days=28)
    }
]

# 插入文章
for article in test_articles:
    article_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO articles (
            id, title, slug, content, excerpt, author_id,
            is_published, is_featured, is_pinned,
            view_count, read_time, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        article_id,
        article["title"],
        article["slug"],
        article["content"],
        article["excerpt"],
        user_id,
        article["is_published"],
        article["is_featured"],
        article["is_pinned"],
        article["view_count"],
        article["read_time"],
        article["created_at"],
        datetime.now()
    ))
    print(f"创建文章: {article['title']}")

conn.commit()
print(f"\n成功创建 {len(test_articles)} 篇测试文章！")

# 验证
cur.execute("SELECT COUNT(*) FROM articles WHERE is_published = true")
count = cur.fetchone()[0]
print(f"数据库中共有 {count} 篇已发布的文章")

conn.close()
