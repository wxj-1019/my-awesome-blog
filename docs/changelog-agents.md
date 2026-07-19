# Agent / 工程修复与变更记录

> 从 `AGENTS.md` §6 迁出（2026-07-20）。  
> **用途**：事后查阅、回归参考。  
> **不要**把长表写回 `AGENTS.md`；新的跨模块问题与修复请追加到本文件。

## 记录表

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
| 2026-07-12 | `docs/rules/.cursorrules` 存在过时示例 | 已更新：lifespan、UUID 主键、Pydantic v2、App Router 导入路径、ESLint 配置名 |
| 2026-07-12 | `backend/app/utils/pagination.py` 中 `CursorPaginationResult` 缺少构造函数 | 已修复：改为 `@dataclass`，支持关键字参数实例化 |
| 2026-07-12 | SQLite 下游标分页 `created_at` 绑定带 `.000000` 导致游标条件失效 | 已修复：`backend/app/crud/article.py` 使用 `func.strftime` 统一秒级字符串比较 |
| 2026-07-12 | 后端测试 `test_cursor_pagination.py` 全部失败 | 已修复：4 项全部通过 |
| 2026-07-12 | 后端完整测试套件 | 已通过：`134 passed, 4 skipped`（4 skipped 为 PostgreSQL 全文搜索） |
| 2026-07-12 | 前端子代理批量修复 ESLint 时引入多处语法错误 | 已修复：`Button.tsx`、`ErrorBoundary.tsx`、`use-toast.ts`、`auth.ts`、`PromptCard.tsx` 等 10+ 文件恢复合法语法 |
| 2026-07-12 | 前端 ESLint 大量 error（unused vars、类型、hooks、解析错误等） | 已修复：`npm run lint` 从 60 errors 降至 0 errors，剩余 warnings（主要为 `any` 与 hook deps） |
| 2026-07-12 | 前端 TypeScript 类型检查报 `_prop` 不存在、重复标识符等 | 已修复：`npm run type-check` 通过 |
| 2026-07-12 | 前端完整审查迭代 | 已通过：`npm test`、`npm run lint`（0 errors）、`npm run type-check`、`npm run build` |
| 2026-07-12 | 前端无障碍合规（accesslint 技能） | 已修复：搜索框 aria-label、头像 alt 文本、标题层级、跳过链接与主内容区标识；`npm test` 通过 |
| 2026-07-12 | 前端图片未使用 next/image | 已修复：受控来源头像、封面、轮播图等迁移至 `next/image`；外部不可控来源保留 `<img>` 并加注释 |
| 2026-07-12 | 前端列表大量使用 `index` 作为 React key | 已修复：数据列表改用稳定 ID/label/slug；静态骨架屏保留 index 并加注释 |
| 2026-07-12 | 客户端页面缺少独立 metadata | 已修复：公开路由拆分为 Server `page.tsx`（导出 metadata）+ Client `*-content.tsx`；`npm run build` 通过 |
| 2026-07-12 | `docs/rules/frontend-rules.md` 未涵盖 Image/key/metadata/a11y 规范 | 已更新：新增/完善页面 metadata、Next.js Image、列表 key、可访问性章节 |
| 2026-07-20 | AGENTS 历史表过长、文档与代码路径漂移 | 已处理：历史迁至本文件；rules 轻量对齐；README 必要同步 |

## 仍影响开发的约定（摘要）

完整规则见 `AGENTS.md`「已知坑」。摘要：

- 后端端口 **8989**（不是 8000）
- `User` 必须有 **`tenant_id`**
- Live2D 因缺 runtime 资源在根布局中注释
- 生产密钥 / `DATABASE_URL` / CORS 必须走环境变量，禁止硬编码
