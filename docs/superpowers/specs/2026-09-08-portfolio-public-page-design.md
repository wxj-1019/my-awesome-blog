# 作品集公开页设计（Portfolio Public Page）

> 日期：2026-09-08
> 状态：方案默认批准（用户未否决，按推荐执行）
> 所属方向：读者触达 —— 后台 portfolio 管理齐全但前台无展示页

## 1. 背景与问题

- 后端 `GET /api/v1/portfolio/` 为公开接口（无鉴权依赖），数据模型齐全：`title/slug/description/cover_image/demo_url/github_url/technologies[]/start_date/end_date/status(completed|in_progress|planned)/is_featured/sort_order`。
- 后台 `admin/portfolios` 管理页在用（自带正确类型的本地 interface）。
- **缺口**：前台没有 `/portfolio` 页面，访客看不到作品。
- **顺带发现**：`frontend/src/lib/api/portfolio.ts` 全库无引用（死代码），且其 interface 字段（image_url/project_url/category/tags）与后端真实返回（cover_image/demo_url/technologies）不符——类型已漂移，需重写对齐。

## 2. 目标与成功标准

访客可通过导航栏「作品集」进入 `/portfolio`，看到按精选优先排列的作品卡片网格（封面、标题、描述、技术栈、状态、demo/GitHub 链接、时间范围）；页面有 SEO metadata 并进入 sitemap。

验收：jest 新增组件测试通过、`tsc --noEmit` 0 错误、lint 0 error、全量回归无退化。

非目标（YAGNI）：不做 `/portfolio/[slug]` 详情页；不做筛选/搜索；不做分页（limit=100 一次取完，作品数量级很小）；不改后端。

## 3. 方案

纯 RSC（React Server Component）实现，**零客户端 JS 增量**：作品列表是只读展示，hover 效果用 CSS `group-hover` 即可，不需要 `'use client'`。数据在服务端通过 `apiFetch` 获取（api-client 已支持服务端 base URL 解析，有 catch 兜底惯例）。

设计体系沿用：GlassCard 玻璃拟态卡片、拉丁 kicker + 思源宋体 h1 的页头体系（参考 about/articles 页头）、EmptyState 空态、Badge 技术栈标签。

## 4. 组成

### 4.1 `frontend/src/lib/api/portfolio.ts`（重写类型）

- `PortfolioItem` interface 按后端 `PortfolioItemBase` 重写：`id/title/slug/description/cover_image/demo_url/github_url/technologies/start_date/end_date/status/is_featured/sort_order/created_at`（可空性与后端一致）。
- 保留 `getPortfolioItems(params?)`，确认其调用路径为 `/portfolio/`（尾斜杠，单段集合路径 api-client 会自动归一化）。
- `PortfolioItemCreate/Update` 同样对齐后端字段（该文件当前无引用，重写无破坏面；admin 页用本地类型不受影响）。

### 4.2 `frontend/src/components/portfolio/PortfolioCard.tsx`（新建，RSC）

- GlassCard 容器 + `group` hover 微交互（封面 scale、标题变色，纯 CSS）。
- 封面 16:9：`cover_image` 有值用裸 `<img>`（MinIO/外部 URL，项目惯例带注释说明），无值用渐变占位 + FolderGit2 图标。
- 角标：`is_featured` → 「精选」徽章；`status` → 已完成/进行中/规划中 三态 Badge（颜色区分）。
- 主体：标题、描述 `line-clamp-2`、技术栈 Badge 列表（最多展示 5 个，超出 "+N"）、日期范围（`start_date – end_date|至今`）。
- 链接区：`demo_url` → ExternalLink 图标链接「在线预览」，`github_url` → Github 图标链接「源码」；均 `target="_blank" rel="noopener noreferrer"`，aria-label 含作品名。
- 整卡不包 `<a>`（卡内有两个独立外链，避免嵌套交互元素）。

### 4.3 `frontend/src/components/portfolio/PortfolioGrid.tsx`（新建，RSC）

- 接收 `items: PortfolioItem[]`，排序：`is_featured` 降序 → `sort_order` 升序 → `created_at` 降序（纯函数 `sortPortfolioItems` 导出以便单测）。
- 响应式网格：`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`。
- 空数组 → EmptyState（title「暂无作品」）。

### 4.4 `frontend/src/app/portfolio/page.tsx`（新建，RSC）

- `generateMetadata`：title「作品集」+ description。
- 页面结构：页头（kicker「SELECTED WORKS」+ 思源宋体 h1「作品集」+ 副文案，先读 about 或 albums 页头对齐字体类名）+ PortfolioGrid。
- 数据：`getPortfolioItems({ limit: 100 })`，`cache: 'no-store'` 或 revalidate 策略参照 articles 页惯例（先看 `frontend/src/app/articles/page.tsx` 的 fetch 方式再定）。

### 4.5 导航与 sitemap

- `Navbar.tsx` navLinks：相册之后插入 `{ href: '/portfolio', label: '作品集', icon: Briefcase }`（lucide-react 有 Briefcase，加进 import）。
- `frontend/src/app/sitemap.ts`：按现有条目格式加 `/portfolio`。

## 5. 错误处理

| 场景 | 行为 |
|------|------|
| 接口失败 | RSC fetch 抛错 → Next error 边界；参照 articles 页惯例决定是否 try/catch 渲染空态 |
| 无作品 | EmptyState 空态 |
| 字段缺失 | 全部可空字段均有兜底（占位封面、隐藏链接区等） |

## 6. 测试

- `sortPortfolioItems` 纯函数单测（精选优先、sort_order、created_at 次序）。
- `PortfolioCard` 渲染测试：完整字段渲染、无封面占位、无链接时链接区不出现、featured/status 徽章。
- `PortfolioGrid`：空态渲染。

## 7. 风险

- 后端 `read_portfolio_items` 的 `is_active` 参数实际映射到 `is_featured` 过滤（quirks，默认 true → 返回全部）。前端不传参取默认即可，本次不动后端。
- 若线上作品数据为空，页面显示空态属预期。
