# AGENTS.md - My Awesome Blog 框架规则

> AI Agent 在本项目中的最高级别规则入口。修改代码前先读本文件，再按模块规则执行。  
> 最后更新：2026-07-23  
> 历史修复记录：[`docs/changelog-agents.md`](./docs/changelog-agents.md)

## 1. 项目定位与架构

企业级全栈个人博客 / 个人站平台：

| 层级 | 技术 | 端口 |
|------|------|------|
| 前端 | Next.js 16 + TypeScript + Tailwind CSS | 3000 |
| 后端 | FastAPI + Python 3.12+ + SQLAlchemy 2.0 + Pydantic v2 | **8989** |
| 数据库 | PostgreSQL 15（生产）/ SQLite（仅测试） | 5432 |
| 缓存 | Redis 7 | 6379 |
| 部署 | Docker Compose + Nginx | — |

### 1.1 能力地图（避免漏改域）

- **博客核心**：文章、分类、标签、评论、RSS
- **扩展内容**：作品集、时间线、相册、友链、打字机文案、订阅、留言
- **多媒体**：音乐、视频、游戏入口（导航「家」`/home`）
- **AI**：多 LLM、Agent 对话（**主用途：写文章辅助**，含润色 polish）、记忆、提示词（前后端 `/ai/*` 与 admin）
- **后台**：`/admin/*` CMS + 监控/审计/天气等
- **基础设施**：JWT、`User.tenant_id`（见 §7 定位说明）、Redis 缓存、OSS、限流、调度

### 1.2 目录结构

```
my-awesome-blog/
├── frontend/                 # Next.js
├── backend/                  # FastAPI
├── docs/
│   ├── rules/                # 模块规则（按任务必读）
│   └── changelog-agents.md   # 历史问题与修复（非必读）
├── nginx/
├── docker-compose.yml
├── docker-compose.prod.yml
├── README.md                 # 人类上手
└── AGENTS.md                 # 本文件
```

## 2. 模块规则与优先级

**优先级（高 → 低）**：用户明确指令 > 本文件全局铁律 > `docs/rules/*` 模块规则 > `docs/rules/.cursorrules`

| 规则文件 | 适用范围 | 何时必读 |
|---------|---------|----------|
| [docs/rules/frontend-rules.md](./docs/rules/frontend-rules.md) | `frontend/src/` | 改页面、组件、Hooks、Services |
| [docs/rules/backend-rules.md](./docs/rules/backend-rules.md) | `backend/app/` | 改 API、CRUD、Services、Models |
| [docs/rules/database-rules.md](./docs/rules/database-rules.md) | Model / migration | 改模型或建迁移 |
| [docs/rules/ai-rules.md](./docs/rules/ai-rules.md) | LLM / 对话 / 记忆 / 提示词 | 改 AI 相关 |
| [docs/rules/ui-design-rules.md](./docs/rules/ui-design-rules.md) | 样式、动画、主题、UI 组件 | 改视觉与组件样式 |
| [docs/rules/frontend-uiux-design-spec.md](./docs/rules/frontend-uiux-design-spec.md) | UI/UX 设计规范（项目版）：设计哲学、令牌、动效预算、交付清单 | 新页面/新组件设计决策 |
| [docs/rules/.cursorrules](./docs/rules/.cursorrules) | 通用编码风格 | 任意编码任务（冲突时服从上表更高项） |
| [docs/rules/README.md](./docs/rules/README.md) | 规则索引 | 不确定读哪份时 |

## 3. 全局铁律

### 3.1 最小改动

- 只改与任务相关的文件和行；不借机重构、不顺手升级依赖。
- diff 保持可 review。

### 3.2 先读后写

- 改前看同目录 2–3 个现有文件，对齐命名与结构。
- 新 API 先看 `backend/app/api/v1/endpoints/articles.py`。
- 新组件先看 `frontend/src/components/ui/GlassCard.tsx`。

### 3.3 类型安全

- 前端：`strict`，禁止 `any`（用 `unknown` 或精确类型）。
- 后端：函数带类型注解；Pydantic 校验入参/出参。

### 3.4 安全

- 禁止硬编码密钥、密码、API Key。
- 生产必须配置 `SECRET_KEY`、`DATABASE_URL`、CORS。
- 上传校验类型与大小；删除校验权限。

### 3.5 性能

- 禁止 N+1；列表必须分页；批量单次 ≤ 100；慢查询加索引。

### 3.6 注释与文档

- 注释优先**中文**；公共函数与复杂逻辑写 docstring。
- 改行为后同步相关注释/文档；**长修复史写 changelog，不写回本文件**。

## 4. Agent 工作流

1. 确认任务涉及哪些模块。  
2. 阅读对应 `docs/rules/*`。  
3. 查看同目录样例代码。  
4. 实现后跑相关验证（见下节命令）。  
5. 声称完成前确认命令输出，不臆测通过。

## 5. 常用命令

### 前端

```bash
cd frontend
npm install
npm run dev          # :3000
npm run build
npm run lint
npm run format
npm test
npm run type-check
```

### 后端

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8989
alembic upgrade head
alembic revision --autogenerate -m "描述"
pytest
```

### Docker

```bash
docker-compose up
docker-compose -f docker-compose.prod.yml up -d
```

## 6. 关键路径

### 前端

- `frontend/package.json` · `frontend/tsconfig.json`（`@/*`）
- `frontend/tailwind.config.js` · `frontend/next.config.mjs`
- `frontend/src/lib/utils.ts`（`cn()`）· `frontend/src/app/layout.tsx`
- `frontend/src/lib/api-client.ts` · `frontend/src/styles/base/variables.css`

### 后端

- `backend/requirements.txt` · `backend/app/main.py`
- `backend/app/api/v1/router.py`（路由注册权威清单）
- `backend/app/core/config.py` · `backend/app/core/database.py`
- `backend/app/exceptions/` · `backend/app/llm/provider_factory.py`

### 文档

- 人类上手：`README.md`
- 历史记录：`docs/changelog-agents.md`
- 主题 token：`docs/theme-tokens.md`

## 7. 已知坑（仍影响行为）

| 项 | 说明 |
|----|------|
| 后端端口 | **8989**，不是 8000 |
| tenant_id | **个人站定位**：非 SaaS 多租户隔离。`User.tenant_id` 非空（注册默认租户），**仅 AI 侧**（prompt / memory / conversation 等）按租户作用域；文章/评论等内容主链**不按租户过滤**。测试造用户必须带 `tenant_id`。勿按「全站多租户」改内容 API |
| Agent chat | `/api/v1/agent/chat` + polish：**写作辅助**（查站内文、润色草稿）；非通用客服 C2 平台 |
| Live2D | 根布局中注释；缺 `public/wanko/runtime`，勿擅自启用 |
| 测试 DB | 默认 SQLite；PG 全文搜索相关用例可能 skip |
| 环境变量 | 密钥与 DB URL 只从 env 读取；README/compose 不写死生产密码 |
| 双数据源 | 部分 Next `app/api/*` 与 FastAPI 并存时，改前确认页面实际调用哪一侧 |

更完整的历史条目见 [`docs/changelog-agents.md`](./docs/changelog-agents.md)。
