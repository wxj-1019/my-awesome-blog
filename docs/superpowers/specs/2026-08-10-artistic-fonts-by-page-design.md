# 分页面艺术字体设计

日期：2026-08-10
范围：`/tools/tarot`、`/tools/image-gen`、`/albums`、`/videos`

## 1. 目标

为 4 个氛围鲜明的公开页面引入各自专属的艺术展示字体，用于页头 kicker（幕标小字）和装饰性文字，强化页面叙事氛围。正文、操作按钮、UI 控件保持现有 `font-sans`（Manrope/Inter）不变，确保可读性与可用性。

共同原则：

- 艺术字体仅用于 kicker 和装饰性文字（页头小字、分幕标签等），不用于正文。
- 字体通过 `next/font/google` 自托管加载，无第三方请求，自动优化子集。
- 每个页面一个字体，通过 CSS 变量局部注入，不污染全局字体栈。
- 新增字体均为单字重（weight: 400），kicker 本身小字 + 全大写 + 宽字距，适合展示字体气质。
- 不改变现有 `font-sans` / `font-display` / `font-mono` 三套全局字体栈。

## 2. 字体分配

| 页面 | 氛围 | 字体 | 字重 | CSS 变量 | 气质说明 |
|---|---|---|---|---|---|
| 塔罗 `/tools/tarot` | 神秘古典 | **Cinzel** | 400 | `--font-cinzel` | 罗马石刻大写字母，占卜/神秘学经典，全大写时仪式感强 |
| 生图 `/tools/image-gen` | 现代创作 | **Fraunces** | 400 | `--font-fraunces` | 现代衬线展示体，光学尺寸变化，AI/创作工具气质 |
| 相册 `/albums` | 画廊记忆 | **DM Serif Display** | 400 | `--font-dm-serif` | 高对比度衬线，优雅戏剧性，画廊/摄影集风 |
| 视频 `/videos` | 电影放映 | **Abril Fatface** | 400 | `--font-abril` | 戏剧化粗衬线，复古海报感，电影/杂志封面风 |

4 个字体均为 Google Fonts 开源字体（OFL 协议），商用免费。

## 3. 技术方案

### 3.1 字体注册

每个页面是 Server Component（`page.tsx`）挂载 Client Component（`*-content.tsx`）。字体注册有两种可行位置：

- **方案 A（推荐）：在 `layout.tsx` 统一注册 4 个字体，`<body>` 注入全部 CSS 变量。** 优点：集中管理、全局可用（后续其他页面也能用）；缺点：全站加载 4 个字体变量（但 `next/font` 按需子集化，未使用的字重不下载实际字形数据，仅注册 CSS 变量约 0 额外字节）。
- **方案 B：在每个页面的 `page.tsx` 局部注册。** 但 `next/font` 不支持在非根布局的嵌套页面中注册（会报 "fonts must be added at the root layout" 警告），技术上不可行。

**结论：采用方案 A**，在 `layout.tsx` 注册 4 个新字体，`<body>` className 追加 4 个 CSS 变量。

### 3.2 Tailwind 映射

在 `tailwind.config.js` 的 `theme.extend.fontFamily` 新增 4 个语义类：

```js
fontFamily: {
  sans: ['var(--font-manrope)', 'var(--font-inter)', 'ui-sans-serif', 'system-ui'],
  display: ['var(--font-syne)', 'var(--font-inter)', 'ui-sans-serif', 'system-ui'],
  // 新增：分页面艺术字体（仅 kicker/装饰用）
  tarot: ['var(--font-cinzel)', 'var(--font-syne)', 'serif'],
  creative: ['var(--font-fraunces)', 'var(--font-syne)', 'serif'],
  gallery: ['var(--font-dm-serif)', 'var(--font-syne)', 'serif'],
  cinema: ['var(--font-abril)', 'var(--font-syne)', 'serif'],
}
```

回退链统一指向 `--font-syne`（现有 display 字体）+ `serif`，字体未加载时降级优雅。

### 3.3 应用位置

`PageActHeader` 组件的 kicker `<p data-act-kicker>` 是 4 个页面的统一入口。当前 kicker 样式：

```
text-[11px] sm:text-xs font-medium tracking-[0.28em] text-white/80
```

新增可选 `kickerFont` prop，接受 Tailwind 字体类名（如 `font-tarot`）。未传时保持现有 `font-medium`（Syne/Manrope），向后兼容。

```tsx
// PageActHeader 新增 prop
interface PageActHeaderProps {
  // ... 现有 props
  /** kicker 艺术字体类（如 font-tarot / font-creative），不传则用默认字体 */
  kickerFont?: string;
}
```

渲染时合并到 kicker `<p>` 的 className：

```tsx
<p data-act-kicker className={cn(
  'text-[11px] sm:text-xs tracking-[0.28em] text-white/80',
  kickerFont ?? 'font-medium'
)}>
```

### 3.4 各页面传入

| 页面文件 | kickerFont 值 | 视觉效果 |
|---|---|---|
| `tarot-content.tsx` | `font-tarot` | Cinzel 全大写罗马体 |
| `image-gen-content.tsx` | `font-creative` | Fraunces 现代衬线 |
| `albums-content.tsx` | `font-gallery` | DM Serif 高对比衬线 |
| `videos-content.tsx` | `font-cinema` | Abril Fatface 戏剧粗衬线 |

## 4. 实施边界

修改文件：

- `frontend/src/app/layout.tsx`：注册 4 个新字体 + `<body>` 注入 CSS 变量
- `frontend/tailwind.config.js`：新增 4 个 fontFamily 映射
- `frontend/src/components/layout/PageActHeader.tsx`：新增 `kickerFont` prop
- `frontend/src/app/tools/tarot/tarot-content.tsx`：传入 `kickerFont="font-tarot"`
- `frontend/src/app/tools/image-gen/image-gen-content.tsx`：传入 `kickerFont="font-creative"`
- `frontend/src/app/albums/albums-content.tsx`：传入 `kickerFont="font-gallery"`
- `frontend/src/app/videos/videos-content.tsx`：传入 `kickerFont="font-cinema"`

不修改：

- 现有 `font-sans` / `font-display` / `font-mono` 定义与使用
- 后端代码、API、数据结构
- 正文、按钮、表单等 UI 元素的字体

## 5. 性能与可访问性

- **性能**：4 个字体各单字重（400），`next/font` 自动子集化（仅含 kicker 用到的字符，约 A-Z + 符号），实际下载量每个约 8-15KB。kicker 文本极短（如 "TAROT"），子集极小。
- **CLS**：`next/font` 自动 `font-display: swap` + size-adjust，无布局偏移。
- **可访问性**：kicker 是装饰性幕标小字，不影响内容语义；艺术字体仅为视觉气质变化，文字内容与对比度不变。
- **降级**：字体未加载时回退到 Syne（现有 display 字体），视觉连续。

## 6. 验收标准

- 4 个页面的 kicker 分别呈现各自艺术字体气质（Cinzel/Fraunces/DM Serif/Abril Fatface）。
- 正文、标题、操作按钮字体不变（font-sans / font-display）。
- `npm run lint`、`npm run type-check`、`npm run build` 通过。
- 现有测试通过，无新增 a11y 违规。
- Lighthouse 字体相关指标无明显劣化（next/font 自托管 + swap）。
