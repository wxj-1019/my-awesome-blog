<!-- From: E:/A_Project/my-awesome-blog/AGENTS.md -->
# AGENTS.md - My Awesome Blog 框架规则

> 本文档是 AI Agent 在本项目中的最高级别规则入口。修改代码前请先阅读本文件，并按模块规则执行。
> 最后更新：2026-07-12

## 1. 项目定位与架构

My Awesome Blog 是一个企业级全栈个人博客平台：

- **前端**：Next.js 16 + TypeScript + Tailwind CSS（端口 3000）
- **后端**：FastAPI + Python 3.12+ + SQLAlchemy 2.0 + Pydantic v2（端口 8989）
- **数据库**：PostgreSQL 15（生产）/ SQLite（仅测试）
- **缓存**：Redis 7
- **部署**：Docker Compose + Nginx 反向代理

### 1.1 目录结构

```
my-awesome-blog/
├── frontend/              # Next.js 前端应用
├── backend/               # FastAPI 后端应用
├── docs/                  # 文档与规则
│   └── rules/             # 各模块框架规则
├── nginx/                 # Nginx 配置
├── docker-compose.yml     # 开发环境
├── docker-compose.prod.yml # 生产环境
└── AGENTS.md              # 本文件：规则总入口
```

## 2. 必读：模块框架规则

本项目采用**模块化规则体系**。任何改动都必须遵循对应模块的规则：

| 规则文件 | 适用范围 | 必须阅读时机 |
|---------|---------|-------------|
| [docs/rules/frontend-rules.md](./docs/rules/frontend-rules.md) | 前端页面、组件、Hooks、Services | 修改 `frontend/src/` 任何文件 |
| [docs/rules/backend-rules.md](./docs/rules/backend-rules.md) | API 端点、CRUD、Services、Models | 修改 `backend/app/` 任何文件 |
| [docs/rules/database-rules.md](./docs/rules/database-rules.md) | 数据库模型、迁移、查询优化 | 修改 Model 或创建 migration |
| [docs/rules/ai-rules.md](./docs/rules/ai-rules.md) | LLM、对话、记忆、提示词 | 修改 AI 相关模块 |
| [docs/rules/ui-design-rules.md](./docs/rules/ui-design-rules.md) | UI 组件、样式、动画、主题 | 修改组件或样式 |
| [docs/rules/.cursorrules](./docs/rules/.cursorrules) | 通用编码风格与约定 | 任何编码任务 |

## 3. 全局铁律

以下规则适用于所有模块，优先级高于模块规则：

### 3.1 最小改动原则
- 只修改与任务相关的文件和行。
- 不借机重构无关代码、不清理未涉及的注释、不升级依赖。
- 保持 diff 最小化，便于 code review。

### 3.2 先读后写
- 修改前先查看同目录下 2-3 个已有文件，确认命名、结构和风格。
- 新增 API 前先查看 `backend/app/api/v1/endpoints/articles.py`。
- 新增组件前先查看 `frontend/src/components/ui/GlassCard.tsx`。

### 3.3 类型安全
- **前端**：TypeScript `strict` 已开启，禁止使用 `any`，优先用 `unknown` 或精确类型。
- **后端**：所有函数必须带类型注解，Pydantic 模型验证输入输出。

### 3.4 安全红线
- 禁止在代码中硬编码密钥、密码、API Key。
- 生产环境必须配置 `SECRET_KEY`、`DATABASE_URL`、CORS。
- 上传文件必须校验类型和大小。
- 删除操作必须校验权限。

### 3.5 性能红线
- 数据库查询禁止 N+1。
- 列表接口必须分页（offset/limit 或 cursor）。
- 批量操作限制单次最多 100 条。
- 慢查询必须加索引。

### 3.6 注释与文档
- 代码注释优先使用**中文**（与现有代码保持一致）。
- 新增公共函数、复杂业务逻辑必须写 docstring/注释。
- 修改行为后必须同步更新相关注释和文档。

## 4. 常用命令速查

### 前端
```bash
cd frontend
npm install
npm run dev          # 开发服务器
npm run build        # 生产构建
npm run lint         # ESLint
npm run format       # Prettier
npm test             # Jest 测试
npm run type-check   # TypeScript 检查
```

### 后端
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8989  # 开发服务器
alembic upgrade head                         # 执行迁移
alembic revision --autogenerate -m "描述"     # 生成迁移
pytest                                       # 运行测试
```

### Docker
```bash
# 开发
docker-compose up

# 生产
docker-compose -f docker-compose.prod.yml up -d
```

## 5. 关键配置与参考文件

### 前端
- `frontend/package.json` - 依赖与脚本
- `frontend/tsconfig.json` - TypeScript 路径别名 `@/*`
- `frontend/tailwind.config.js` - 主题、颜色、动画
- `frontend/next.config.mjs` - Next.js 配置
- `frontend/src/lib/utils.ts` - `cn()` 工具函数
- `frontend/src/app/layout.tsx` - 根布局（主题、字体、Provider）

### 后端
- `backend/requirements.txt` - Python 依赖
- `backend/app/main.py` - FastAPI 入口与中间件链
- `backend/app/api/v1/router.py` - API 路由注册
- `backend/app/core/config.py` - 配置与校验
- `backend/app/core/database.py` - 数据库引擎与 Session
- `backend/app/exceptions/__init__.py` - 统一异常体系

## 6. 问题与修改记录

| 日期 | 问题 | 状态 |
|------|------|------|
| 2026-07-11 | README 中后端端口写为 8000，实际使用 8989 | 已修复（README.md / backend/README.md / QWEN.md） |
| 2026-07-11 | README 写 Next.js 14，实际为 16.1.6 | 已修复（README.md / QWEN.md） |
| 2026-07-11 | 根目录 package.json 与 frontend/package.json 有重复依赖 | 已修复（删除根目录 package.json，同步更新 QWEN.md） |
| 2026-07-11 | `frontend/src/app/layout.tsx` 中 Live2DWidget 被注释 | 已记录原因：缺少 public/wanko/runtime 模型资源，启用会加载失败 |
| 2026-07-12 | 后端测试大量 401 失败 | 已修复：在 `backend/app/tests/conftest.py` 添加全局认证绕过 fixture |
| 2026-07-12 | 后端测试缺少 `db` / `superuser_token_headers` fixture | 已修复：在 conftest.py 补充别名与兼容 fixture |
| 2026-07-12 | `User` 模型测试数据缺少 `tenant_id` 导致非空约束失败 | 已修复：测试用 User 均提供 `tenant_id=uuid.uuid4()` |
| 2026-07-12 | `/api/v1/categories/name/{name}` 端点缺失 | 已补充，使用 `crud.get_category_by_name` |
| 2026-07-12 | `/api/v1/tags/name/{name}` 端点缺失 | 已补充，使用 `crud.get_tag_by_name` |
| 2026-07-12 | Next.js 16 构建警告 `experimental.typedRoutes` 已迁移 | 已修复：将 `typedRoutes` 移出 `experimental` |
| 2026-07-12 | 根目录遗留 stale `package-lock.json` | 已删除（根目录 package.json 已移除） |
| 2026-07-12 | `frontend/src/utils/dateUtils.ts` ESLint 错误 | 已修复：interface 改 type、补充 if 花括号 |
| 2026-07-12 | `frontend/src/services/websocketService.ts` 未使用参数 | 已修复：将 `event` 重命名为 `_event` |
| 2026-07-12 | `docs/rules/frontend-rules.md` 未反映近期前端改造 | 已更新：api-client、Article 类型、拆分样式、ArticleCard、mock 数据等规范 |
| 2026-07-12 | `docs/rules/.cursorrules` 存在过时示例 | 已更新： lifespan、UUID 主键、Pydantic v2、App Router 导入路径、ESLint 配置名 |
| 2026-07-12 | `backend/app/utils/pagination.py` 中 `CursorPaginationResult` 缺少构造函数 | 已修复：改为 `@dataclass`，支持关键字参数实例化 |
| 2026-07-12 | SQLite 下游标分页 `created_at` 绑定带 `.000000` 导致游标条件失效 | 已修复：`backend/app/crud/article.py` 使用 `func.strftime` 统一秒级字符串比较 |
| 2026-07-12 | 后端测试 `test_cursor_pagination.py` 全部失败 | 已修复：4 项全部通过 |
| 2026-07-12 | 后端完整测试套件 | 已通过：`134 passed, 4 skipped`（4 skipped 为 PostgreSQL 全文搜索） |
| 2026-07-12 | 前端子代理批量修复 ESLint 时引入多处语法错误 | 已修复：`Button.tsx`、`ErrorBoundary.tsx`、`use-toast.ts`、`auth.ts`、`PromptCard.tsx` 等 10+ 文件恢复合法语法 |
| 2026-07-12 | 前端 ESLint 大量 error（unused vars、类型、hooks、解析错误等） | 已修复：`npm run lint` 从 60 errors 降至 0 errors，剩余 181 warnings（主要为 `any` 与 hook deps） |
| 2026-07-12 | 前端 TypeScript 类型检查报 `_prop` 不存在、重复标识符等 | 已修复：`npm run type-check` 通过 |
| 2026-07-12 | 前端完整审查迭代 | 已通过：`npm test`、`npm run lint`（0 errors）、`npm run type-check`、`npm run build` |
| 2026-07-12 | 前端无障碍合规（accesslint 技能） | 已修复：搜索框 aria-label、头像 alt 文本、标题层级、跳过链接与主内容区标识；`npm test` 通过 |
| 2026-07-12 | 前端图片未使用 next/image | 已修复：受控来源头像、封面、轮播图等迁移至 `next/image`；外部不可控来源保留 `<img>` 并加注释 |
| 2026-07-12 | 前端列表大量使用 `index` 作为 React key | 已修复：数据列表改用稳定 ID/label/slug；静态骨架屏保留 index 并加注释 |
| 2026-07-12 | 客户端页面缺少独立 metadata | 已修复：公开路由拆分为 Server `page.tsx`（导出 metadata）+ Client `*-content.tsx`；`npm run build` 通过 |
| 2026-07-12 | `docs/rules/frontend-rules.md` 未涵盖 Image/key/metadata/a11y 规范 | 已更新：新增/完善页面 metadata、Next.js Image、列表 key、可访问性章节 |

---

> **Agent 工作前必做**：
> 1. 确认本次任务涉及哪些模块。
> 2. 阅读对应模块规则文件。
> 3. 查看同目录现有代码样例。
> 4. 按规则实现，完成后验证相关测试/构建。
