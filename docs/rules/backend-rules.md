# 后端框架规则

> 适用于 `backend/app/` 下所有代码。修改后端代码前必须阅读本文件。  
> 全局铁律见 [AGENTS.md](../../AGENTS.md)。最后更新：2026-07-20

## 1. 技术栈与版本

- **框架**: FastAPI 0.115.6
- **服务器**: Uvicorn 0.36.0（开发端口 **8989**）
- **语言**: Python 3.12+
- **ORM**: SQLAlchemy 2.0（当前使用同步 Session）
- **验证**: Pydantic v2 + pydantic-settings
- **认证**: JWT（python-jose + passlib + bcrypt）
- **缓存**: Redis（redis-py + 自定义 cache_service）
- **限流**: slowapi + 自定义装饰器
- **任务调度**: APScheduler

## 2. 目录结构与职责

```
backend/app/
├── main.py                          # FastAPI 入口与生命周期
├── api/v1/
│   ├── router.py                    # API 路由总线（注册权威清单）
│   └── endpoints/                   # 各模块 API 端点（与 router 对齐）
│       ├── auth.py, users.py, tenants.py
│       ├── articles.py, comments.py, categories.py, tags.py
│       ├── messages.py, albums.py, portfolio.py, friend_links.py
│       ├── llm.py, conversations.py, memories.py, prompts.py
│       ├── monitoring.py, audit_logs.py, statistics.py, weather.py
│       └── ...（以 router.py include_router 为准）
├── core/
│   ├── config.py, database.py, dependencies.py
│   ├── security.py, exception_handlers.py, types.py
│   └── langchain/                   # LangChain 适配（可选）
├── models/, schemas/, crud/, services/
├── utils/, exceptions/, middleware/
├── llm/                             # provider_factory.py + 各 provider
├── prompts/, conversation/
└── tests/
```

## 3. 应用启动与生命周期

- `app/main.py` 使用 `@asynccontextmanager` 的 `lifespan` 管理启动和关闭。
- 启动时自动连接 Redis、启动天气调度器。
- 关闭时断开 Redis、停止调度器。
- 禁止再使用已废弃的 `@app.on_event`。

## 4. API 端点规则

### 4.1 路由注册
- 所有 endpoint 在 `backend/app/api/v1/router.py` 中注册。
- 每个 endpoint 文件导出一个 `APIRouter` 实例，命名为 `router`。
- URL 前缀使用 `snake_case` 或 `kebab-case`，与现有保持一致。

### 4.2 Endpoint 函数签名
```python
from fastapi import APIRouter, Depends, status, Query, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app import crud
from app.schemas.article import Article, ArticleCreate
from app.models.user import User
from typing import Any

router = APIRouter()

@router.post("/", response_model=Article)
async def create_article(
    request: Request,
    *,
    db: Session = Depends(get_db),
    article_in: ArticleCreate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    创建新文章
    """
    article = crud.create_article(db, article=article_in, author_id=current_user.id)
    return article
```

### 4.3 同步 vs 异步
- 当前数据库使用**同步** SQLAlchemy Session（`get_db`）。
- Endpoint 可声明为 `async`；**热路径**（列表、搜索、创建、slug 详情等）的同步 CRUD / 查询必须用 `asyncio.to_thread()` 包一层，避免堵事件循环。
- 已有 `*_async` CRUD 若内部已 `to_thread`/`run_in_executor`，直接 `await`，勿再套一层。
- 批量/复杂删除等同样 `to_thread`。
- 示例：
  ```python
  articles = await asyncio.to_thread(
      crud.get_articles, db, skip=skip, limit=limit, published_only=True
  )
  # 或
  deleted_count, slugs, deleted_ids = await asyncio.to_thread(_delete_articles_sync)
  ```
- 中长期可选：迁 AsyncSession；未迁移前**禁止**在 async 路由里直接跑重查询而不 `to_thread`。

### 4.3.1 个人站 · tenant 定位（避免误读）
- 产品是**单站个人博客**，不是多租户 SaaS。
- `User.tenant_id` 非空；注册默认租户 ID 固定。
- **内容主链**（articles / comments / categories / tags / …）**不按** `tenant_id` 过滤。
- **AI 侧**（prompts / memories / conversations 等）可按 `tenant_id` 作用域。
- Agent：`/agent/chat`、`/agent/polish` 主场景是**写文章辅助**（查站内文、润色），见 [ai-rules.md](./ai-rules.md)。

### 4.4 依赖注入顺序
```python
request: Request,              # 可选，用于限流/日志
db: Session = Depends(get_db),
current_user: User = Depends(get_current_active_user),  # 或 get_current_superuser
*,                            # 关键字参数分隔
body_param: SomeSchema,
query_param: str = Query(...)
```

## 5. 异常处理规则

### 5.1 统一异常体系
- 优先使用 `app.exceptions` 中的自定义异常：
  - `NotFoundException`
  - `ConflictException`
  - `ValidationException`
  - `InternalServerException`
  - `UnauthorizedException`
  - `ForbiddenException`
- 只有在没有对应自定义异常时才使用 `HTTPException`。

### 5.2 使用示例
```python
from app.exceptions import NotFoundException, ConflictException

# 资源不存在
if not article:
    raise NotFoundException(resource="Article", identifier=article_id)

# 冲突（如 slug 重复）
if existing_article:
    raise ConflictException(resource="Article", field="slug", value=article_in.slug)
```

### 5.3 错误日志
- 所有异常和关键操作使用 `app.utils.logger.app_logger` 记录。
- 异常必须带 `exc_info=True`。

## 6. 权限规则

- `get_current_active_user`: 已登录且激活的用户。
- `get_current_superuser`: 仅超级管理员。
- 文章、评论等资源的修改/删除权限在 CRUD 或服务层校验。
- 批量操作通常仅允许超级管理员，除非业务明确允许普通用户操作自己的数据。

## 7. 限流规则

- 读操作使用 `article_read_rate_limit` 等读限流装饰器。
- 写操作使用 `article_create_rate_limit` 等写限流装饰器。
- 登录/注册使用专门的 `login_rate_limit` / `register_rate_limit`。
- 新增 endpoint 时参考同类 endpoint 添加限流。

## 8. 缓存规则

- 使用 `app.services.cache_service.cache_service`。
- 读操作命中缓存，写操作清除相关缓存。
- 缓存 key 命名规范：`{resource}:{identifier}`，如 `article:slug:hello-world`。
- 批量更新后可使用 `delete_pattern`，但要注意避免误伤。

## 9. UUID 处理

- 所有主键使用 UUID（`uuid.uuid4`）。
- Endpoint 接收 `str` 类型的 ID，内部转换为 `UUID`。
- 使用 `app.utils.common_helpers.parse_uuid_list` 处理批量 ID。
- Schema 中使用 `@field_serializer` 将 UUID 序列化为字符串。

## 10. 分页规则

- 简单分页：`skip`/`limit`。
- 大数据流式分页：cursor 分页（`CursorPaginationParams`）。
- 默认 `limit` 不超过 100。
- 列表响应必须支持分页参数。

## 11. 批量操作规则

- 批量接口路径：`POST /batch/{action}`。
- 单次批量操作最多 100 条记录。
- 必须记录操作日志（谁、多少条、哪些 ID）。
- 批量更新后清除相关缓存。

## 12. Schema 规则

### 12.1 分层 Schema
```python
class ArticleBase(BaseModel):
    title: str
    slug: str
    content: str

class ArticleCreate(ArticleBase):
    category_id: Optional[UUID] = None
    tags: Optional[List[UUID]] = []

class ArticleUpdate(BaseModel):
    title: Optional[str] = None

class ArticleInDBBase(ArticleBase):
    id: UUID
    created_at: datetime

    @field_serializer('id', 'author_id')
    def serialize_uuids(self, value: UUID) -> str:
        return str(value)

    model_config = {'from_attributes': True}

class Article(ArticleInDBBase):
    pass
```

### 12.2 注意事项
- 使用 Pydantic v2 语法：`model_config = {'from_attributes': True}`。
- 不要用 Pydantic v1 的 `class Config: from_attributes = True`。
- 复杂关系模型用 `model_rebuild()` 解决前向引用。

## 13. 测试规则

### 13.1 基本约定
- 测试文件：`backend/app/tests/test_*.py`。
- 使用 `pytest` + `fastapi.testclient.TestClient`。
- 异步测试使用 `@pytest.mark.asyncio`。
- 新增 endpoint 必须新增对应测试。

### 13.2 测试基础设施（`backend/app/tests/conftest.py`）
- 默认使用 SQLite 内存数据库：`DATABASE_URL=sqlite:///:memory:`。
- 测试期间禁用 Redis 限流与天气调度器，避免事件循环/限流干扰。
- **全局认证绕过**：通过 `app.dependency_overrides` 替换 `get_current_active_user` / `get_current_superuser`，避免大量测试因 401 失败；fixture 为 `autouse=True`。
- **数据库会话**：`test_session` fixture 提供 SQLAlchemy Session；`db` 为其别名，兼容旧测试。
- **超级管理员 header**：`superuser_token_headers` 返回空 dict，认证已由依赖注入绕过。

### 13.3 测试数据规范
- 直接创建 `User` 模型时必须提供 `tenant_id=uuid.uuid4()`（生产模型该字段非空）。
- API 返回的 UUID 已序列化为字符串，断言时与模型对象比较应使用 `str(obj.id)`。
- 测试「资源不存在」时，路径参数应使用合法 UUID，如 `uuid.uuid4()`，而非整数 `99999`（FastAPI 路径参数校验会先返回 422）。
- 若测试依赖 PostgreSQL 特有功能（如全文搜索），在 SQLite 测试环境下使用 `@pytest.mark.skip(reason="SQLite 不支持 xxx")` 跳过。

## 14. 禁止事项

- ❌ 禁止在 endpoint 中直接写原始 SQL（除非优化需求并经过评审）
- ❌ 禁止在代码中硬编码密钥、密码
- ❌ 禁止无权限校验的删除/批量操作
- ❌ 禁止使用同步 `time.sleep` 阻塞事件循环
- ❌ 禁止未分页的列表接口
- ❌ 禁止使用 Pydantic v1 语法

## 15. 示例文件参考

- 入口：`backend/app/main.py`
- 路由总线：`backend/app/api/v1/router.py`
- Endpoint：`backend/app/api/v1/endpoints/articles.py`
- Model：`backend/app/models/article.py`
- Schema：`backend/app/schemas/article.py`
- Service：`backend/app/services/llm_service.py`
- 异常：`backend/app/exceptions/__init__.py`
- 配置：`backend/app/core/config.py`
