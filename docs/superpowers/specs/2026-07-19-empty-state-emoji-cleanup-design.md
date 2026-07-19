# 空状态统一 + UI 层清 emoji 设计

> 日期：2026-07-19  
> 状态：已批准（方案 1）  
> 范围：前端 UI；不改后端协议；Logo 不加 Lottie

## 1. 背景与目标

### 1.1 目标

- 全站 **UI 层**不再用 emoji 充当图标或装饰。
- 列表 / 空库统一使用 **lucide + 文案 + CTA** 的 `EmptyState`。
- 导航 Logo 维持固定宽度 SVG（`BrandLogo`），**不使用 Lottie**。
- 留言反应 / 表情选择器：展示为 lucide；**API / 存储 key 仍为现有 emoji 字符串**。

### 1.2 非目标

- 导航 / 品牌 Logo 引入 Lottie。
- 空状态引入 Lottie 动画资源。
- 修改后端 reaction / message schema。
- 剥离用户留言、评论、文章**正文**中的 emoji。
- 时间线等用户可配置 icon 字段的历史数据迁移。
- 第二套主题或无关重构。

### 1.3 已确认决策

| 项 | 选择 |
|----|------|
| 范围 | 全站清 emoji + 空状态（含留言） |
| Logo | 不用 Lottie，保持 SVG |
| 空状态观感 | 统一 lucide + 引导文案 / CTA（无 Lottie） |
| 实现路径 | 方案 1：收敛到现有 `EmptyState`，不新建并行 PublicEmptyState |

## 2. 架构

### 2.1 组件边界

| 单元 | 职责 | 不负责 |
|------|------|--------|
| `EmptyState`（增强） | 统一空态：icon / title / description / action / variant；token 色；`prefers-reduced-motion` | 拉数据、业务判断 |
| 各页面 / 列表 | 判断是否为空后传入文案与 CTA | 手写圆标 +「暂无」结构 |
| 留言反应 / 表情 UI | lucide 展示；映射表 emoji key ↔ icon | 改后端 API 协议 |
| `BrandLogo` | 保持现状 | 本期任何改动 / Lottie |

### 2.2 留言反应数据流

```
用户点击 [ThumbsUp 图标]
  → UI 查表得到 emoji key（如 "👍"）
  → 提交 payload 仍为该 key（兼容现有后端）
  → 渲染时 key → LucideIcon，不渲染 raw emoji 作主图标
```

用户在正文中自行输入的 emoji：**保留，不 strip**。

## 3. EmptyState API

在 `frontend/src/components/ui/EmptyState.tsx` 上增强，不新建组件。

```ts
variant?: 'default' | 'search' | 'error' | 'create'  // 已有
title?: string
description?: string
icon?: LucideIcon
action?: {
  label: string
  href?: string
  onClick?: () => void
  icon?: LucideIcon
}
className?: string
// 新增
size?: 'sm' | 'md'     // 默认 md；表格 / 侧栏用 sm
compact?: boolean      // 减少垂直 padding，嵌入卡片时用
```

### 3.1 视觉与动效

- glass 圆标 + lucide 图标，颜色走语义 token（`foreground` / `primary` / `muted`），避免硬编码与主题脱节的 tech 色滥用（可保留轻微 primary 点缀）。
- 入场 motion 保留；**`prefers-reduced-motion: reduce` 时关闭**循环 blur / scale 光晕，仅静态展示。
- 按钮使用现有设计体系（primary / glass），不引入新视觉语言。

## 4. 共享映射

新增文件（二选一路径，实现时取一）：

- 推荐：`frontend/src/lib/emoji-icon-map.ts`

导出：

1. **反应类型表** `REACTION_CATALOG`：`{ key, icon, label }[]`
2. **输入 / 快捷面板精选** `COMPOSER_EMOJI_CATALOG`：16～24 项，同上结构
3. 工具函数：`getReactionIcon(key)`、`getReactionLabel(key)`

### 4.1 反应映射（MessageReactions）

| key (API) | Lucide | aria-label |
|-----------|--------|------------|
| ❤️ | Heart | 喜欢 |
| 👍 | ThumbsUp | 赞同 |
| 👎 | ThumbsDown | 不赞同 |
| 🔥 | Flame | 精彩 |
| 😂 | Laugh | 好笑 |
| 🚀 | Rocket | 支持 |
| ✨ | Sparkles | 亮点 |

- 主按钮渲染 **Icon**，不渲染 `<span>{emoji}</span>`。
- 粒子特效改为小圆点 / 主色粒子或图标缩小淡出，**不再飞 emoji 字符**。
- `activeReaction` 等状态比较仍用 emoji key。

### 4.2 输入 / QuickActions

- 大段 raw emoji 网格 → 精选 catalog，每项图标 + `title` / `aria-label` 中文。
- **点击仍向 textarea 插入 unicode emoji 字符**（用户内容自由；仅选择器外观为图标）。
- `MessageInput` 与 `QuickActions` 共用同一 catalog。
- 本期不做 `:shortcode:` 替换插入。

## 5. 迁移清单

### 5.1 公开页 → EmptyState

| 位置 | 目标 |
|------|------|
| `app/articles/articles-content.tsx` | EmptyState + BookOpen；筛选空用 `search`，无内容可 CTA 回首页 |
| `components/home/FeaturedHighlights.tsx` | EmptyState compact/sm |
| `components/messages/MessageList.tsx` | EmptyState + MessageSquare；可选 onClick 聚焦输入 |
| `components/messages/VirtualMessageList.tsx` | 同上 |
| `components/messages/MessageReplies.tsx` | compact 空态 |
| `components/articles/CommentTree.tsx` | 同留言空态模式 |
| `components/home/Portfolio.tsx` | EmptyState / compact |
| `components/chat/ChatSidebar.tsx` | EmptyState sm |
| `components/ai/chat/ChatSidebar.tsx` | EmptyState sm |
| `components/chat/PromptSettings.tsx` | 接入 EmptyState |
| `components/music/SongList.tsx` | EmptyState sm |
| `app/profile/components/*` 活动/社交空 | EmptyState sm 或图标+文案一致化 |
| `components/ui/DataTable.tsx` 内置 empty | 对齐 EmptyState 视觉或委托组件 |

**保持轻量（不整块 EmptyState）：**

- `components/articles/ArticleTocRail.tsx` — 侧栏「本文暂无目录」维持短文案即可。

### 5.2 Admin

- 已大量使用 `EmptyState`：仅做与增强 API 的兼容与 reduced-motion / token 一致性，**不强制改业务文案**。

### 5.3 装饰 emoji → lucide

| 位置 | 处理 |
|------|------|
| `app/contact/contact-content.tsx` | 去掉文案中 ✨；可选旁挂 Sparkles 图标 |
| `app/profile/components/ProfileView.tsx` | 👤→User，👥→Users |
| `components/messages/ReportDialog.tsx` | icon 字段改为 LucideIcon（Ban / Angry / AlertTriangle / FileText 等） |
| `app/admin/timeline/page.tsx` placeholder | 改提示文案；不迁移已存 emoji 数据 |

### 5.4 留言相关文件

- `MessageReactions.tsx` — catalog + 图标展示 + 粒子去 emoji
- `MessageInput.tsx` — 内联条接 catalog
- `QuickActions.tsx` — 接 catalog
- `VirtualMessageList.tsx` — mock 反应展示走同一渲染逻辑

## 6. 实现顺序

1. 共享映射 `emoji-icon-map.ts`
2. 增强 `EmptyState`（size / compact / reduced-motion / token）
3. 公开页空态迁移（文章 → 留言 → 精选/作品/聊天 → 其余）
4. 装饰 emoji 清理
5. 留言反应 + 输入 / QuickActions
6. 验收：lint、type-check、关键路径手测

## 7. 风险与对策

| 风险 | 对策 |
|------|------|
| 后端仍认 emoji key | UI 双向映射；payload 不改 |
| VirtualMessageList 假数据 | 同步改展示逻辑 |
| 窄卡片内 EmptyState 过高 | `compact` / `size="sm"` |
| 图标选择器不知插入何字符 | 每项中文 title / aria-label |
| 扫漏装饰 emoji | rg 验收；catalog 内 key 字符串允许 |
| diff 面大 | 按实现顺序提交/修改，禁止无关重构 |

## 8. 验收标准

- [ ] 业务 UI 中无装饰性 emoji 作为图标（catalog key、测试夹具、用户正文除外）。
- [ ] 公开列表空态具备 icon + 标题；（合适时）具备 CTA。
- [ ] 反应点击网络 payload 与改前一致（emoji key）。
- [ ] `prefers-reduced-motion` 下 EmptyState 无循环光晕动画。
- [ ] 相关文件 `npm run lint`、`npm run type-check` 通过。
- [ ] BrandLogo 行为与布局宽度不变。

## 9. Lottie 结论（记录）

- **可以**用 Lottie 做品牌开场或空状态动效，但**不推荐**作为导航常驻 Logo（布局、性能、reduced-motion、首屏成本）。
- 本期明确：**Logo 与空状态均不使用 Lottie**；项目已有 `lottie-react` 可留作后续可选增强，不在本规格范围。
