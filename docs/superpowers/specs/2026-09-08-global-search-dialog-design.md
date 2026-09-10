# 全局搜索弹窗设计（Global Search Dialog）

> 日期：2026-09-08
> 状态：已批准（方案 A）
> 所属方向：读者触达 —— 激活已建成但未接入的后端全文搜索能力

## 1. 背景与问题

- 后端已上线 jieba 中文全文搜索接口 `GET /api/v1/articles/search-fulltext`（返回 `List[ArticleWithAuthor]`，含 title/slug/excerpt/cover_image）。
- **前端全库 0 处调用**：文章页 `FilterBar` 的搜索仅作用于当前列表过滤（走 `/articles?search=`），读者无法检索全站历史文章。
- **导航栏搜索按钮是死按钮**：`Navbar.tsx` 的搜索按钮与 Cmd/Ctrl+K 快捷键都调用 `focusSearch()`，试图聚焦 `id="global-search-input"` 的输入框，但该元素全库不存在，点击无任何反应。

## 2. 目标与成功标准

任意页面可通过导航按钮或 Cmd/Ctrl+K 唤起搜索弹窗；输入中文关键词能搜到已发布历史文章；键盘可完成全程操作（↑↓ 选择、Enter 跳转、Esc 关闭）；移动端可用。

验收：`jest` 组件测试通过、`tsc --noEmit` 0 错误、`next lint` 0 error。

非目标（YAGNI）：不搜作品集/相册/标签；不做独立 /search 页面；不做搜索词高亮（后端不返回 headline）；不做最近搜索历史。

## 3. 方案选择

选定**方案 A：自研轻量弹窗，零新依赖**。项目已有 Radix Dialog（文章目录在用），自研弹窗贴合 GlassCard 设计系统与艺术字体体系。

否决方案：引入 cmdk（新依赖、样式需适配，违反"不顺手加依赖"铁律）；独立搜索页（用户已否决）。

## 4. 架构

纯前端新增，**零后端改动**。数据流：

```
Navbar 搜索按钮 / Cmd+K
  → GlobalSearch Dialog 打开（open state）
  → 输入 → 300ms 防抖
  → apiFetch GET /articles/search-fulltext?search_query=&limit=20（带 AbortSignal）
  → 结果列表渲染（封面缩略图 + 标题 + 摘要）
  → Enter/点击 → router.push(`/articles/${id}`)（跳转前关闭弹窗）
```

竞态与取消：每次新输入 abort 上一次请求（沿用 2026-09-08 修复轮确立的 cleanup 规矩）；组件卸载时 abort。

## 5. 组件设计

### 5.1 `frontend/src/lib/api/search.ts`（新增）

- `searchArticlesFulltext(query: string, signal?: AbortSignal): Promise<ArticleWithAuthor[]>`
- 走 `apiFetch`，`limit=20`、`published_only=true`（接口默认即 true，显式传以表意）。
- 前端类型复用现有 article 类型定义（先看 `src/lib/api/` 下文章 service 的类型来源，保持一致）。

### 5.2 `frontend/src/components/navigation/GlobalSearch.tsx`（新增）

- Radix Dialog 实现；桌面居中面板、移动端近全屏。
- 内部状态：`query` / `results` / `loading` / `error` / `activeIndex`。
- 输入防抖 300ms；`query.trim()` 为空时清空结果、不发请求。
- 键盘：↑↓ 移动 activeIndex（循环）、Enter 跳转选中项、Esc 关闭（Dialog 自带）。
- 三态：加载态（骨架或 spinner，沿用现有 loading 组件）、空结果态（沿用 EmptyState 组件惯例）、错误态（内联提示，不打 toast）。
- 样式：`bg-glass`/`backdrop-blur` 设计令牌、`focus-visible` 焦点环（项目规则第 11 条）；先读 `GlassCard.tsx` 与文章目录 Dialog 用法对齐。
- a11y：`role="dialog"` 由 Radix 提供；输入框 `aria-label="搜索文章"`；结果列表 `role="listbox"`、项 `role="option"` + `aria-selected`。

### 5.3 `Navbar.tsx`（改动）

- 新增 `searchOpen` state；搜索按钮 `onClick` 与 Cmd/Ctrl+K 快捷键改为 `setSearchOpen(true)`；删除 `focusSearch()` 与 `global-search-input` 死代码。
- 移动端菜单（mobileMenuOpen 面板）补充搜索入口项。
- `<GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />` 挂载于 Navbar 内。
- 注意现有 Cmd+K keydown 监听逻辑（约 175 行）一并改写，保留对 `/admin` 路径不渲染 Navbar 的行为。

### 5.4 不改的部分

`FilterBar`（文章页列表内筛选）职责不同，保持不动；后端接口不动。

## 6. 错误处理

| 场景 | 行为 |
|------|------|
| 请求失败/超时 | 内联错误提示 + 可重试（重新输入即触发） |
| 空关键词 | 不发请求，显示初始引导态（"输入关键词搜索文章"） |
| 无结果 | EmptyState 风格空态 |
| 快速连续输入 | abort 旧请求，只渲染最新一次结果 |

## 7. 测试

- `src/lib/api/search.ts`：mock apiFetch，验证 URL 参数（search_query/limit/published_only）与 signal 透传。
- `GlobalSearch.tsx` 组件测试：
  1. 打开/关闭（按钮与 Cmd+K 两条路径）
  2. 输入防抖后触发搜索（fake timers）
  3. ↑↓/Enter 键盘导航与跳转
  4. 空结果态、错误态渲染
  5. 新输入 abort 旧请求（可选，视 mock 成本）

## 8. 风险与备注

- `search-fulltext` 依赖 PostgreSQL；SQLite 开发/测试环境下接口行为需在联调时确认（后端 crud 有方言降级逻辑则无碍，实现时先读 `crud.search_articles_fulltext` 确认）。
- 接口返回完整 `content` 字段，20 条结果 payload 偏大；本期接受（YAGNI），后续如需优化可让后端加精简响应模型。
