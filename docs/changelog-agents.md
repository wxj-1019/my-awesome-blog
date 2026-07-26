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
| 2026-07-20 | 首页四期氛围优化（深海×电影） | 已实施：`DiveTransition` 多层入水（色带/折光/光柱 scrub/减半气泡）、`DepthAmbience` 分幕环境（全静态）、`HomeActSection.depth`、展厅顶光+暗角+齿孔；审查修补：主折光与光柱 **opacity 仅 GSAP**（去 class 叠乘）；文档承认 **多源稀疏气泡**（Hero/Dive/Ambient 分级） |
| 2026-07-23 | 后端定位与热路径：多租户易误读；Agent chat 用途；async 路由同步 CRUD | 已文档化：个人站、`tenant_id` 仅 AI/预留；chat 主用途写文章；`articles` 热路径 `asyncio.to_thread`；Agent 系统提示改为写作辅助 |
| 2026-07-20 | `BubbleField` 气泡几乎不上浮 | 已修复：keyframes 的 translate 百分比相对气泡自身尺寸，改为按容器高度注入 `--rise` 像素行程；新增 `withHighlight` prop 供水下稀疏段减半 DOM |
| 2026-07-20 | `FeaturedHighlights.test.tsx` 断言过时 testid `featured-satellite-card` | 已修复：改为与 `ReelCard` 实际一致的 `featured-reel-card`（改动前复现确认） |
| 2026-07-20 | `jest-axe` 在 devDependencies 声明但未安装，全部前端测试无法启动 | 已安装；`home` / `DiveTransition` / `HomeCyberLayers` / `FeaturedHighlights` 4 套件 13 用例通过 |
| 2026-07-20 | 全局动态背景缺失；浅色模式挂 pastel 风 Canvas 粒子（`DynamicBackground`）与深海叙事冲突，且 `PageDecorations` / `FloatingParticles` 为无引用死代码 | 已处理：新建 `components/visual/AmbientBackground.tsx`（渐变基底 + 双光斑 CSS 漂移 + 稀疏气泡 + 噪点，全 token / 双主题 / RM 静态），经 `theme-wrapper` 全局挂载；`layout.tsx` 内层容器去 `bg-background` 让氛围透出（body 保留底色）；删除 `DynamicBackground` / `PageDecorations` / `FloatingParticles` 三个被替代/死代码组件 |
| 2026-07-26 | DeepSeek 模型对话全链路不可用（401 / 模型名不支持 / 流式报错） | 已修复三层：① 前端 `ChatWindow` 流式请求未带 JWT（401）→ 加 `Authorization: Bearer` 头；② `deepseek-chat` / `deepseek-reasoner` 官方已于 2026-07-24 弃用 → 全量改为 `deepseek-v4-flash`（config / schema / .env.example / 前端 ai/chat，共 6 处）；③ V4 流式部分 chunk 返回 `content:null` 触发 Pydantic 校验错 → `deepseek_provider.py` 用 `delta.get('content') or ''` 兜底 |
| 2026-07-26 | `/chat` 对话页 UI/UX 与全站设计体系脱节（非 token 配色、Footer 遮挡、缺 Markdown 渲染、死代码） | 已修复：PromptSettings.tsx（976 行）批量 token 化；ChatWindow assistant 消息接入 `MarkdownRenderer` + 401 跳登录；Footer 在 `/chat`、`/ai/chat` 路由 `return null`（原 z-30 遮盖 hack 移除）；删除零引用的 MessageBubble / ChatInput / ModelSelector 三组件；对话页定位「写作助手」（metadata + 移除提示词模块） |
| 2026-07-26 | 后台 `/admin` 导航栏遮挡页面顶部内容（双层导航栏叠加） | 已定位真因：根布局渲染的前台 `<Navbar>`（`fixed top-0 z-[100]`）覆盖在 admin 的 `motion.header`（`sticky top-0 z-30`）之上。已修复：`Navbar` 在 `/admin` 路由 `return null`（与 Footer 在 `/chat` 的处理模式一致，条件 return 置于所有 hooks 之后）；顺带 `admin/layout.tsx` `<main>` 加 `scroll-pt-24`，文章编辑页 `sticky top-6` → `top-20` 避开 64px header |
| 2026-07-26 | chat 页「AI 工具收藏」为跳转链接，离开对话才能浏览工具 | 已重构为页内弹窗选用：新建 `SkillPickerDialog.tsx`（domain 筛选 / ESC + overlay 关闭 / token 化）；`ChatSidebar` 底部 Link→button；`ChatWindow` 顶栏固定文案改可交互 skill chip（已选显示名称 + 清除，未选显示选择按钮）；选中 skill 的 SKILL.md 全文作为 `messages` 首位 `{role:system}` 注入（顺带修复死代码：原 `system_prompt` 字段后端 schema 不接收）；`chat-content.tsx` 持有 selectedSkill 状态 + localStorage 持久化 |
| 2026-07-26 | chat 顶栏 Menu 图标按钮冗余；工具弹窗长列表居中偏上溢出 | 已修复：移除顶栏 Menu 按钮（侧栏桌面端常驻 / 移动端走自身遮罩），清理 `onToggleSidebar` 与 `Menu` import；弹窗居中由 `translate` 定位改为遮罩层 `flex items-center justify-center` 容器，避免 `max-h` 长列表配合 `translate-y` 时顶部溢出视口 |

## 仍影响开发的约定（摘要）

## 仍影响开发的约定（摘要）

完整规则见 `AGENTS.md`「已知坑」。摘要：

- 后端端口 **8989**（不是 8000）
- `User` 必须有 **`tenant_id`**
- Live2D 因缺 runtime 资源在根布局中注释
- 生产密钥 / `DATABASE_URL` / CORS 必须走环境变量，禁止硬编码
