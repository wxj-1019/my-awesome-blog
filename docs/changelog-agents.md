# Agent / 工程修复与变更记录

> 从 `AGENTS.md` §6 迁出（2026-07-20）。  
> **用途**：事后查阅、回归参考。  
> **不要**把长表写回 `AGENTS.md`；新的跨模块问题与修复请追加到本文件。

## 记录表

| 日期 | 问题 | 状态 |
|------|------|------|
| 2026-08-09 | 塔罗/生图工具页 UI/UX 多轮迭代（spec: `docs/superpowers/specs/2026-08-09-tarot-image-gen-uiux-design.md`） | 已实施：①塔罗问牌首屏降噪（引导并入主卡、今日之牌压缩）；②进度条/抽牌/解读层级强化；③洗切阶段回显问题、牌阵迷你示意、历史窄栏两行布局；④生图「生成设置」折叠区（localStorage 记忆）、恢复历史聚焦提示词、结果 hover 放大角标；⑤生图画布空态/进度/错误状态层级；全量测试 303 通过、lint 0 error、build 通过 |
| 2026-08-12 | 后台写文章无法提供文件/视频资料位置 | 已实施「文章资料」：新表 `article_attachments`（migration 019），字段 name/url/media_type/mime_type/file_size/is_reference/sort_order；`ArticleCreate/Update` 增 `attachments`（全量替换语义），`ArticleWithAuthor` 响应带 attachments（全部查询补 `joinedload` 防 N+1）；`/oss/upload` 白名单扩至视频/音频/PDF/ZIP（新增 `ALLOWED_ATTACHMENT_MIME_TYPES`，图片端点不受影响），视频 200MB / 音频 100MB / 常规 10MB 分类上限；前端新建/编辑文章表单加 `ArticleAttachmentsEditor`（本地上传→MinIO 或粘贴 URL，可勾「仅作者参考」）；详情页按类型渲染资料区块（video/audio/image/file，`is_reference=true` 不展示）。测试 279 passed + 新增 3 条附件用例；type-check / lint / build 通过 |
| 2026-08-13 | 移除前台模型对话功能 | 按用户要求删除前台两套对话页：`/chat`（写作助手）与 `/ai/chat`（AI Studio 对话），及独用组件 `components/chat/*`、`components/ai/chat/*`、`services/conversationService.ts`；同步清理入口（Navbar 百宝箱、/tools、/online-tools 卡片、Footer 隐藏逻辑、AILayout「对话」导航项）与死代码（`llm.ts` 的 streamChatRaw/chat/getModels、`types/index.ts` 的 Conversation 系列类型）。**保留**：后台 /admin/conversations·prompts·memories 管理页、/ai/memories、/ai/prompts、后台写作辅助（/agent/*）、塔罗 AI 解读（streamChat + /llm/chat/stream）；后端零改动。验证：tsc / eslint 0 error / build 通过（/chat、/ai/chat 已从路由消失）、前端 307 测试通过、后端 279 passed |
| 2026-08-13 | 艺术字体渲染不到位（全站审查 + 补全） | 根因：①导航栏 Zen Maru Gothic 是日文字集，简体字（页/乐/馆/视/频/图/戏/册/宝/线/罗/联）无字形逐字回退宋体，圆体/宋体混排——navi 回退链改系统无衬线（ui-sans-serif/system-ui）；②creative/gallery/cinema/gothic 回退链补 `var(--font-noto-serif-sc)` 防中文落 SimSun；③PageHeader 主标题补 `font-serif`（about/tools/online-tools/home/skills 索引）；④contact/messages/profile 页头补 kickerFont（sf-pro-display/cinema/sf-pro-display）；⑤games/music 内容标题补 `font-display`（Hero/Grid/Card/Modal/Banner/Section/Artist/Playlist/PlayerBar）；⑥articles 侧栏与 about 页标题补 `font-serif`；⑦PageActHeader 过时注释 font-tarot→font-gothic。验证 tsc / eslint 0 error / build 通过 |
| 2026-08-13 | 引入 graph loop（图循环）理念 | 联网调研（LangGraph/ReAct/条件边/checkpoint/HITL/LazyGraphRAG）后按用户选择**轻量自研、全链路**落地：①新基元 `app/agent/graph.py`（GraphLoop：节点/条件边/循环边/append reducer/max_steps/checkpoint_cb，纯 asyncio 零依赖，8 单测）；②写作会话阶段机加**回退边** `REGRESSIONS`（draft_review→outline_review、outline_review→clarifying、drafting→outline_review）+ 新端点 `POST /{id}/regress` + **修复现存 BUG**（流中断卡 drafting 无法重试）+ 前端 OutlineReview/DraftReview「返回上一步」按钮、编辑器「回到 AI 写作」入口（5 单测）；③polish 环图循环化（critique→write 环，GraphLoop 表达，API 兼容）；④AgentLoop 工具循环迁移到图基元（agent↔tools 环，语义不变）；⑤迭代检索（LazyGraphRAG 风格）：`_iterative_retrieval` 检索→LLM 评估→改写查询→再检索（最多 3 轮，ilike 零依赖，3 单测），generate_stream context_mode=auto 接入。后端 295 passed（+16 新测试），前端 tsc/eslint/build 通过 |
| 2026-08-13 | 写文章流程体验优化（10 项） | 修复 4 个严重缺陷：①**停止生成后 UI 永久卡死**（postSse 对 AbortError 静默返回，streamingRef 卡 true 毒化会话——handleStop 手动 finishStream + drafting 死胡同视图「重新生成初稿/返回大纲/复制已生成部分」）；②**全文建议应用后正文不变**（onApplyRevision 签名加 replacement 参数，suggestion 来源整篇写回）；③**重复创建草稿**（articleIdRef 跟踪，首次 create 后续 update，发布同理）；④**无自动保存**（debounce 2.5s 静默保存 new/edit 两页 + SPA 导航未保存确认 + 校验与发布统一）。体验增强 6 项：⑤进度条可点击回退（与 REGRESSIONS 对齐）；⑥澄清模板 chips（技术教程/产品评测/生活随笔/读书笔记）；⑦中文词数统计修复（CJK 逐字 + 拉丁词分离，countWords/estimateReadingMinutes 抽到 shared）；⑧MarkdownToolbar 包裹选区 + 光标定位（修复 cursorOffset 死代码，斜体 **→*）；⑨流失败保留部分内容可复制；⑩contentHashSync 统一抽到 shared + 头/中/尾多段采样（中段编辑也能触发冲突提示）。验证：tsc / eslint 0 error / build / 前端 307 测试通过（ArticleSuggestions 断言随新签名更新） |
| 2026-08-13 | 导航「首页」的「页」字未应用艺术字体 | 根因：Zen Maru Gothic 是日文字集，简体「页/乐/馆/视/频/图/戏/册/宝/线/罗/联」等无字形回退系统黑体。修复：加载站酷快乐体 ZCOOL KuaiLe（简体全覆盖圆润字体），navi 回退链改 `zen-maru-gothic → zcool-kuaile → 系统无衬线`；实测 62 个导航字符全部有字形来源。后续全站缺字审查：全部艺术字体回退链含中文兜底无 tofu；gothic/creative/gallery/cinema 仅渲染英文 ✓ |
| 2026-08-13 | 字体风格一致性（全站第二轮审查） | ①联系页中文标题（当前状态/响应时间/常见问题等）用 SF Pro 系统栈与全站宋体标题体系不一致——改 `font-serif`，正文删 `sf-pro-text` 用默认无衬线，英文 kicker 保留 SF Pro；②音乐页歌名/歌单名/歌手名用 font-display（Syne）中文回退宋体与小 UI 不协调——改 `font-sans`；区块大标题保留 font-display。低风险项（观察不修）：打字机生僻字回退、kicker 拆分格式脆弱、tarot-share SVG 系统字体（跨平台不一致，next/font 限制） |
| 2026-08-13 | 文章详情页阅读设置（新功能） | 新增「阅读设置」面板：字号（4 档 15/17/19/21px）、行距（1.6/1.8/2.0）、字距（0.02/0.06em）、字体（宋体/无衬线）+ 恢复默认。实现：`lib/reading-settings.ts`（localStorage v1 + sanitize + 注入 storage 单测范式，8 条测试）；`ReadingSettingsPanel`（GlassCard 常驻 + 分段按钮组 aria-pressed）；详情页 inline style 覆盖 `.article-reading-surface` 硬编码排版（优先级最高）+ 字体条件类；面板位置优先级：左轨目录下 → 右轨相关文章下 → 正文顶部（移动端正文顶部副本）；默认值与现网一致无 hydration 跳变。前端 55 套件 353 测试通过 |
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
