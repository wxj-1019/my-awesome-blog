# 数据库框架规则

> 适用于 SQLAlchemy Model、Alembic 迁移、数据库查询优化。修改数据库相关代码前必须阅读本文件。

## 1. 数据库选型

- **生产环境**: PostgreSQL 15（必须）
- **开发/测试**: SQLite 可以临时使用，但不允许用于生产部署
- **向量扩展**: PGVector（用于 AI 长期记忆）

## 2. ORM 规范

### 2.1 基础模型
- 所有模型继承自 `app.core.database.Base`。
- 表名使用复数小写：`articles`、`users`、`comments`。
- 主键使用 `UUID(as_uuid=True)`，默认 `uuid.uuid4`。

### 2.2 模型字段定义
```python
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, UUID, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base

class Article(Base):
    __tablename__ = "articles"

    __table_args__ = (
        Index('idx_article_published_created', 'is_published', 'created_at'),
        Index('idx_article_author_published', 'author_id', 'is_published'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False, index=True)
    slug = Column(String(200), unique=True, index=True, nullable=False)
    content = Column(Text, nullable=False)
    is_published = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    author_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    author = relationship("User", back_populates="articles")
    comments = relationship(
        "Comment",
        back_populates="article",
        cascade="all, delete-orphan"
    )
```

### 2.3 外键与关系
- 外键必须显式指定 `ondelete` 行为。
- 一对多关系配置 `back_populates` 和 `cascade`。
- 多对多关系通过关联表（`article_categories`、`article_tags`）实现。
- 关联表模型必须存在，并配置 `overlaps` 避免 SQLAlchemy 警告。

## 3. 索引规则

### 3.1 必须加索引的字段
- 主键（自动）
- 外键
- 经常用于 `WHERE`、`ORDER BY`、`JOIN` 的字段
- 搜索字段（title、excerpt、meta_description）
- 状态字段（is_published、is_featured、is_pinned）
- 时间字段（created_at、published_at）

### 3.2 复合索引
- 对高频组合查询建立复合索引。
- 示例：
  ```python
  Index('idx_article_published_featured', 'is_published', 'is_featured', 'created_at')
  ```

### 3.3 索引命名
- 统一前缀 `idx_{table}_{fields}`。
- 多个字段用下划线连接。

## 4. 查询规则

### 4.1 避免 N+1
- 列表查询使用 `joinedload` 或 `selectinload` 预加载关系。
- 示例：
  ```python
  from sqlalchemy.orm import joinedload

  articles = db.query(Article).options(
      joinedload(Article.author),
      joinedload(Article.categories)
  ).all()
  ```

### 4.2 分页
- 所有列表查询必须分页。
- 使用 `limit`/`offset` 或 cursor 分页。
- 最大返回条数不超过 100。

### 4.3 只查需要的字段
- 大数据量场景避免 `SELECT *`，使用 `load_only`。

### 4.4 复杂查询封装
- 复杂过滤逻辑封装到 `app.utils.db_utils` 或 CRUD 中。
- 不要在 endpoint 中写长链式查询。

## 5. CRUD 规则

### 5.1 文件组织
- 每个模型一个 CRUD 文件：`app/crud/article.py`。
- 在 `app/crud/__init__.py` 中聚合导出。

### 5.2 CRUD 函数签名
```python
def create_article(db: Session, article: ArticleCreate, author_id: UUID) -> Article:
    db_article = Article(**article.model_dump(), author_id=author_id)
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article
```

### 5.3 软删除
- 项目已实现软删除机制（`app.core.soft_delete`）。
- 删除前确认是物理删除还是逻辑删除。
- 默认使用物理删除的模型必须显式说明原因。

## 6. 迁移规则

### 6.1 迁移工具
- 使用 Alembic 管理所有 schema 变更。
- 配置文件：`backend/alembic.ini`。
- 迁移脚本目录：`backend/alembic/versions/`。

### 6.2 生成迁移
```bash
cd backend
alembic revision --autogenerate -m "add article read_time"
```

### 6.3 迁移前检查
- 生成迁移后必须人工 review 迁移脚本。
- 确认没有误删字段或表。
- 确认索引命名符合规范。
- 大数据表添加字段/索引需考虑 `postgresql_using` 或分阶段执行。

### 6.4 执行迁移
```bash
alembic upgrade head
```

### 6.5 回滚
```bash
alembic downgrade -1
```

## 7. 字段命名规范

- 使用 `snake_case`。
- 时间字段：`created_at`、`updated_at`、`published_at`。
- 状态字段：`is_published`、`is_featured`、`is_pinned`、`is_active`。
- 计数字段：`view_count`、`likes_count`、`comments_count`。
- 外键字段：`{entity}_id`。

## 8. 数据一致性

- 重要业务操作使用数据库事务。
- 多表更新在同一个 session 中完成。
- 批量操作失败时回滚。

## 9. 生产环境注意事项

- 生产必须使用 PostgreSQL。
- 配置连接池：`pool_size`、`max_overflow`、`pool_recycle`。
- 定期 `VACUUM ANALYZE`。
- 监控慢查询，及时加索引。

## 10. 禁止事项

- ❌ 禁止手动修改已应用的 migration 文件
- ❌ 禁止在 model 中使用可变默认值（如 `default=[]`）
- ❌ 禁止无索引的大表全表扫描
- ❌ 禁止在 migration 中直接删除生产数据
- ❌ 禁止未 review 就执行 autogenerate 迁移

## 11. 示例参考

- Model：`backend/app/models/article.py`
- CRUD：`backend/app/crud/article.py`
- 关联表：`backend/app/models/article_category.py`、`backend/app/models/article_tag.py`
- 迁移：`backend/alembic/versions/`
