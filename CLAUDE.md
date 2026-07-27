# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 规则优先级（必读）

本仓库已有成体系的 Agent 规则，**本文件不重复其内容**：

1. 用户明确指令
2. [`AGENTS.md`](./AGENTS.md) — 全局铁律（最小改动、先读后写、类型安全、性能红线）
3. [`docs/rules/*`](./docs/rules/) — 模块规则，改对应模块前必读：
   - `frontend-rules.md` → `frontend/src/`
   - `backend-rules.md` → `backend/app/`
   - `database-rules.md` → Model / Alembic 迁移
   - `ai-rules.md` → LLM / 对话 / 记忆 / 提示词
   - `ui-design-rules.md` + `frontend-uiux-design-spec.md` → 样式、动画、主题
4. `docs/rules/.cursorrules` — 通用编码风格

注释与文档优先使用**中文**（与现有代码一致）。长修复记录写入 `docs/changelog-agents.md`，不要回写 `AGENTS.md`。

## 常用命令

### 前端（`frontend/`）

```bash
npm run dev          # :3000
npm run build
npm run lint         # eslint . --ext .ts,.tsx
npm run type-check   # tsc --noEmit
npm run format       # prettier --write .
npm test             # jest
npm run test:watch

# 单测单文件 / 单用例
npx jest src/lib/emoji-icon-map.test.ts
npx jest -t "renders article card"
```

Jest 用 `ts-jest` + jsdom，`@/*` 映射到 `src/*`，CSS 走 `identity-obj-proxy`。覆盖率阈值目前为 0（不强制）。

### 后端（`backend/`）

```bash
uvicorn app.main:app --reload --port 8989   # 注意端口是 8989，不是 8000
alembic upgrade head
alembic revision --autogenerate -m "描述"    # 生成后必须人工 review
pytest

# 单测单文件 / 单用例
pytest app/tests/test_articles.py
pytest app/tests/test_agent_loop.py::test_xxx
pytest -k "agent and not registry"
```

`pytest.ini` 已设 `testpaths=app/tests`、`asyncio_mode=auto`，无需在测试里手写 `@pytest.mark.asyncio` 的 event loop 配置。

### Docker / 部署

```bash
docker-compose up                              # dev: Postgres + Redis + backend
docker-compose -f docker-compose.prod.yml up -d

# 本机部署到服务器（需 rsync + SSH），默认走层缓存，不要加 --no-cache
export DEPLOY_SERVER_IP=<ip>
./deploy.sh
DEPLOY_TARGET=frontend ./deploy.sh
FORCE_NO_CACHE=1 ./deploy.sh                   # 仅排查用，很慢

# 已在服务器上改代码
bash scripts/server-redeploy.sh {frontend|backend|all}
```

## 架构要点

前后端分离的 monorepo：Next.js 16 App Router（:3000）+ FastAPI（:8989）+ PostgreSQL 15 + Redis 7，Nginx 反代。

### 后端请求链路

```
main.py (lifespan: 连 Redis / 启动天气调度器)
  → 中间件栈: RequestLogging → RateLimit → PerfMonitor → RequestSizeLimit → CORS
  → api/v1/router.py  ← 路由注册的唯一权威清单（27 个 endpoint 模块）
  → endpoints/*.py    → crud/*.py → models/*.py
                      → services/*.py（跨模块业务：llm_service、cache_service、
                        conversation_service、memory_service、weather_update_service）
  → exceptions/ 自定义异常 → core/exception_handlers.py 统一转 HTTP 响应
```

关键约束（细节见 `backend-rules.md`）：

- **SQLAlchemy 是同步 Session，路由多为 `async`**。热路径（列表 / 搜索 / 创建 / slug 详情 / 批量删除）的同步 CRUD 必须 `await asyncio.to_thread(...)` 包一层；已带 `to_thread` 的 `*_async` CRUD 直接 `await`，不要套两层。
- 主键全部 UUID；endpoint 收 `str` 内部转 `UUID`，Schema 用 `@field_serializer` 序列化回字符串。
- 报错优先用 `app.exceptions` 里的 `NotFoundException` / `ConflictException` 等，而非裸 `HTTPException`。
- 新增 endpoint 要配套加限流装饰器 + 写缓存失效 + 补测试。

### AI 子系统

`llm/provider_factory.py`（文件名就是 `provider_factory.py`，不是 `factory.py`）统一多家 provider（DeepSeek / GLM / Qwen）。上层：`services/llm_service.py` 做聊天与流式（SSE 必须以 `data: [DONE]` 收尾），`conversation/engine.py` + `agent/` 提供 Agent 循环与站内检索工具，记忆分短期（Redis，TTL）与长期（PGVector，相似度阈值召回），`prompts/` 管提示词版本与 A/B。

Agent 的主场景是**写文章辅助**（`/api/v1/agent/chat` 检索站内文、`/agent/polish` Writer-Critic 润色），不是通用客服。

### 前端数据流

```
app/**/page.tsx (默认 Server Component)
  → services/*Service.ts   (业务组合)
  → lib/api/*.ts           (按领域封装的 API)
  → lib/api-client.ts      (统一 axios 实例，禁止组件内裸 fetch)
```

整页需要 `'use client'` 时，拆成 `page.tsx`（Server Component，导出 `metadata`）+ `*-content.tsx`（Client Component），保证每个公开页有独立 title/description。

样式分层：`styles/base/variables.css`（主题 token）→ `styles/animations/`（关键帧）→ `styles/components/`（组件特效）；`globals.css` 只留主题变量和基础样式。颜色一律走主题变量（`bg-background` / `text-foreground`），玻璃拟态基础组合是 `bg-glass/30 backdrop-blur-xl border border-glass-border`。文章卡片统一复用 `components/ui/ArticleCard.tsx`，需要变体就扩展它而不是复制新组件。

## 容易踩的坑

| 坑 | 说明 |
|----|------|
| 后端端口 | **8989**，不是 8000 |
| `tenant_id` | 个人站，不是多租户 SaaS。`User.tenant_id` 非空，**仅 AI 侧**（prompt / memory / conversation）按租户作用域；文章、评论等内容主链**不按 tenant 过滤**。测试里直接建 `User` 必须传 `tenant_id=uuid.uuid4()` |
| 双数据源 | `frontend/src/app/api/*` 的 Next Route Handlers 与 FastAPI 并存，改之前先确认页面实际调的是哪一侧 |
| 测试认证 | `app/tests/conftest.py` 用 `dependency_overrides` **全局绕过**认证（`autouse`），`superuser_token_headers` 返回空 dict；别再手动造 token |
| 测试 DB | 默认 SQLite 内存库；依赖 PG 特性（全文搜索、PGVector）的用例需 `@pytest.mark.skip` |
| 测试 404 断言 | 路径参数要用合法 UUID（`uuid.uuid4()`），用 `99999` 会先被 FastAPI 校验拦成 422 |
| Live2D | 根布局中已注释，`public/wanko/runtime` 缺失，不要擅自启用 |
| 密钥 | `.env.production` 在工作区内，`DATABASE_URL` / `SECRET_KEY` 只从 env 读，compose 与文档里不写死 |

## 其它入口

- 运行中的接口文档：http://localhost:8989/docs
- 历史问题与修复：`docs/changelog-agents.md`
- 主题 token 说明：`docs/theme-tokens.md`
- 后端细节（含 Windows 下 `scripts/init_db.py`、`scripts/migration_status.py` 等辅助脚本）：`backend/README.md`
