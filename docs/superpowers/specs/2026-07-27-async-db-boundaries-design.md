# Articles / Comments / Conversations Async DB 边界治理设计

> 日期：2026-07-27  
> 状态：已确认设计，待实施计划  
> 范围：`backend/app` 的 articles、comments、conversations 三个业务域

## 1. 背景

项目当前使用同步 SQLAlchemy `Session` 和同步 engine。FastAPI 路由既有同步 `def`，也有 `async def`。部分 `async def` 在事件循环线程内直接执行同步查询、提交或调用“async 外壳、内部仍同步访问数据库”的 CRUD/service，可能阻塞事件循环并放大并发尾延迟。

旧审计中的“13 个 async 路由未卸载 DB”已不能作为准确基线：当前路由与 service/CRUD 已发生变化，且单看 endpoint 会漏掉伪 async 调用链。本批以当前工作树为准，按调用链审计 articles、comments、conversations 三域。

当前工作树已有用户在途改动，包括：

- articles 统一分页信封、列表 total 统计与对应测试；
- conversations 分页摘要、UUID serializer 与列表 N+1 修复；
- comments 内容校验、模型别名与自定义异常修复；
- 大量 frontend admin 页面调整。

本批必须在这些改动上增量实施，不回退、不覆盖、不混入无关重构。

## 2. 目标

1. 三域 `async` 路由不在事件循环内执行同步 SQLAlchemy 查询或事务操作。
2. 不把 request-scoped `Session` 或绑定 Session 的 ORM 对象传入 `asyncio.to_thread()`。
3. 必须保留 async 的缓存、LLM 和流式路由，只在短生命周期数据库阶段使用线程池。
4. 数据库阶段在线程内创建、使用、提交/回滚并关闭自己的 Session。
5. 不在 Redis、LLM 请求或流式响应期间持有数据库事务或连接。
6. 保持当前 API 响应模型、状态码、分页合同与业务语义。

## 3. 非目标

本批不处理以下剩余审计项：

- 限流覆盖（当前显式覆盖约 19/194）；
- 裸 `HTTPException` 全量迁移；
- `email_service` 删除或接线；
- 关联表反向索引及 Alembic 迁移；
- 全站 `AsyncSession` 迁移；
- frontend admin 在途改动。

直接因本批重构触及的错误路径可沿用现有自定义异常，但不做机械式异常批量替换。

## 4. 方案选择

### 4.1 采用：短生命周期同步 DB 阶段

- 纯数据库路由改为同步 `def`，由 FastAPI 在线程池执行整个 handler。
- 必须保留 `async` 的路由，将数据库操作拆成同步核心函数并通过线程池调用。
- 同步核心函数内部自行创建和关闭 Session，只接收 UUID、字符串、Pydantic DTO 或普通值。
- async 层负责 Redis、LLM、StreamingResponse 等异步 I/O。

这是在不迁移全站 `AsyncSession` 的前提下，兼顾事件循环安全和 SQLAlchemy Session 线程边界的最小正确方案。

### 4.2 未采用方案

1. **直接把 DI Session 传给 `to_thread`**：改动小，但 Session 会跨线程顺序迁移，不属于 SQLAlchemy 保证用法。
2. **三域迁移 AsyncSession**：长期更整洁，但会牵动共享依赖、CRUD、测试与其它域，超出本批范围。
3. **只把纯 DB async 路由改为 def**：无法关闭 conversations 的 LLM/stream 混合链路风险。

## 5. 架构边界

### 5.1 Comments

Comments 路由当前均为同步 `def`。FastAPI 会在线程池执行 handler，因此：

- 保持同步路由；
- 不新增多余的 `to_thread`；
- 保留当前评论模型、校验和异常在途改动；
- 仅通过测试确认响应与事务行为未回退。

### 5.2 Articles

#### 纯 DB 路由

以下纯数据库读路由改为同步 `def`：

- featured；
- popular；
- recommended；
- search；
- cursor-paginated；
- search-fulltext。

FastAPI 线程池负责执行 request-scoped Session 的完整生命周期。

#### 混合路由

包含 Redis await 或其它异步 I/O 的路由保留 `async`，例如：

- slug 详情；
- related；
- 单条详情与 view count；
- 更新；
- 删除。

每个路由将同步数据库阶段封装为独立核心函数。核心函数在线程内：

1. 创建 Session；
2. 完成该阶段全部查询和写入；
3. 提交或回滚；
4. 返回普通值、DTO 或已序列化数据；
5. 关闭 Session。

数据库提交成功后，async 层再清理缓存。缓存失败不回滚已提交的数据库事务，记录日志并依赖 TTL 或后续写操作恢复一致性。

### 5.3 Conversations

#### 纯 DB 路由

以下路由改为同步 `def`，对应 service/engine 数据库方法改为同步核心：

- 创建会话；
- 获取会话；
- 会话列表；
- 更新会话；
- 获取消息；
- 清空消息。

当前 `Page[ConversationSummary]`、UUID serializer 和列表不加载 messages 的行为必须保留。

#### 混合路由

以下路由保留 `async`：

- 删除会话（数据库 + memory/Redis 清理）；
- 普通 chat；
- 流式 chat。

混合路由使用短数据库阶段，不让 Session 穿过 LLM await 或流式迭代。

## 6. Chat 数据流与事务阶段

### 6.1 普通 Chat

1. `prepare_chat_sync`：
   - 创建或校验会话；
   - 保存用户消息；
   - 更新该阶段必要元数据；
   - 提交并关闭 Session。
2. await LLM 请求。
3. `persist_reply_sync`：
   - 保存助手消息；
   - 更新 token / message 统计；
   - 在同一事务中提交；
   - 失败时回滚并关闭 Session。

LLM 失败时，已提交的用户消息保留；不写助手消息，不增加助手相关统计。

### 6.2 流式 Chat

1. 流开始前执行 `prepare_chat_sync` 并关闭 Session。
2. 流式读取 LLM，不持有数据库 Session。
3. 正常结束后执行 `persist_reply_sync`，保存完整助手响应并更新统计。
4. 客户端中断或生成器取消时，不保存截断 assistant 消息；确保所有流资源释放，且没有悬挂 Session。

### 6.3 删除会话

- conversation 删除与数据库 context 清理放在同一数据库事务；
- 提交后再执行 Redis / memory 清理；
- 外部清理失败记录日志，但不伪装成数据库删除失败。

## 7. Session 与类型边界

同步数据库核心只允许接收：

- UUID / string / int / bool 等标量；
- Pydantic 输入 DTO；
- 纯 Python 集合。

禁止接收：

- `Depends(get_db)` 创建的 Session；
- 绑定 Session 的 ORM `current_user`；
- 延迟加载关系的 ORM 对象。

进入线程边界前，从 `current_user` 提取 `id`、`tenant_id`、权限标志等标量。同步核心的返回值不得依赖 Session 关闭后的 lazy load。

## 8. 事务与错误策略

每个写同步核心遵循：

```python
db = SessionLocal()
try:
    # query / mutate
    db.commit()
    # materialize return value
except Exception:
    db.rollback()
    raise
finally:
    db.close()
```

约束：

- 不依赖 dependency cleanup 代替显式 rollback；
- 不在网络 await 期间持有事务；
- 同一数据库阶段的多项写入必须同事务提交；
- 数据库与 Redis/LLM 不强行做分布式原子事务；
- 缓存和 memory 失败需记录可诊断日志；
- 保留认证等需要特殊 header/状态语义的现有 HTTP 错误行为。

## 9. 与当前在途改动的兼容要求

- 保留 articles 的 `Page[ArticleWithAuthor]` 和过滤条件一致的 total 统计；
- 保留 conversations 的 `Page[ConversationSummary]` 和不加载 messages 的列表行为；
- 保留 comments 内容非空/限长、模型别名和 NotFoundException 修复；
- 不改动 frontend admin 文件；
- 不提交或修改未跟踪的 `CLAUDE.md`；
- 修改同一文件时在当前 diff 上增量合并；
- Async DB 测试独立命名，便于审查本批边界治理。

## 10. 测试设计

### 10.1 静态边界检查

- 三域 async endpoint 不直接执行 `db.query()`、`commit()`、`delete()` 等同步 DB 操作；
- 三域 async endpoint 不调用“async 外壳、内部同步 DB”的函数；
- 不把 DI Session 作为 `to_thread` 参数或闭包捕获值。

### 10.2 API 回归

覆盖 articles/comments/conversations 的：

- 列表与分页；
- 详情；
- 创建；
- 更新；
- 删除；
- 消息列表与清空；
- 既有状态码和响应模型。

### 10.3 事件循环探针

用可控的慢同步 DB 阶段与短 `asyncio.sleep` 并行，验证 async cache/chat 路由不会阻塞事件循环。

### 10.4 Session 生命周期

通过可注入 Session factory 或代理记录：

- 创建线程 ID；
- execute/commit/rollback/close 线程 ID；
- 一个同步核心的 Session 全生命周期只在同一 worker 线程；
- 异常路径调用 rollback 和 close。

### 10.5 故障注入

- article category/tag 写入中途失败时无阶段内部分提交；
- assistant message 或统计更新失败时整个 reply 阶段回滚；
- context 删除失败时 conversation 删除阶段回滚；
- LLM 失败时保留用户消息，但不写助手消息及相关统计；
- 流中断时不保存截断 assistant，Session 均已关闭。

### 10.6 执行顺序

1. articles/comments/conversations 定向 pytest；
2. Async DB 边界专项测试；
3. 后端完整 pytest。

SQLite 测试无法完整证明 PostgreSQL 连接池和线程行为。当前以线程代理测试和代码边界审查作为保障；PostgreSQL 并发集成测试记录为剩余风险，本批不引入新测试基础设施。

## 11. 完成标准

- 三域定向测试通过；
- 后端完整测试通过，或明确记录与本批无关的既有失败；
- 三域 async endpoint 静态审计不再发现直接同步 DB 调用；
- 没有 Session 跨 `await` 或跨线程传递；
- 写同步核心均有显式 rollback/close；
- 当前分页、schema 与 N+1 修复不回退；
- diff 不包含 frontend admin、限流、异常全迁移、邮件或索引改动。

## 12. 后续批次

完成本批后，按独立设计继续：

1. 限流高风险面与真实 429 测试；
2. 裸 HTTPException 按业务域迁移；
3. 关联表反向索引与 Alembic 迁移；
4. email_service 删除或正式接线决策。
