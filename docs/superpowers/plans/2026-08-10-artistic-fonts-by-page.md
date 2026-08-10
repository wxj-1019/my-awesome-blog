# 分页面艺术字体实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为塔罗、生图、相册、视频 4 个页面各自引入艺术展示字体，仅用于 kicker（幕标小字），强化页面叙事氛围。

**Architecture:** 在 `layout.tsx` 用 `next/font/google` 注册 4 个新字体并注入 `<body>` CSS 变量；`tailwind.config.js` 新增 4 个语义字体类；`PageActHeader` 新增可选 `kickerFont` prop，4 个页面各自传入对应字体类。正文、标题、操作按钮字体完全不变。

**Tech Stack:** Next.js 16 `next/font/google`、Tailwind CSS、TypeScript strict。

---

## 文件地图

| 文件 | 职责 | 改动类型 |
|---|---|---|
| `frontend/src/app/layout.tsx:3,15-17,91` | 注册字体 + 注入 CSS 变量 | 修改 |
| `frontend/tailwind.config.js:36-41` | fontFamily 新增 4 个语义类 | 修改 |
| `frontend/src/components/layout/PageActHeader.tsx:8-18,44-52` | 新增 `kickerFont` prop | 修改 |
| `frontend/src/app/tools/tarot/tarot-content.tsx:358-365` | 传入 `kickerFont="font-tarot"` | 修改 |
| `frontend/src/app/tools/image-gen/image-gen-content.tsx:400-407` | 传入 `kickerFont="font-creative"` | 修改 |
| `frontend/src/app/albums/albums-content.tsx:257-262` | 传入 `kickerFont="font-gallery"` | 修改 |
| `frontend/src/app/videos/videos-content.tsx:157-161` | 传入 `kickerFont="font-cinema"` | 修改 |

## 实施约束

- 不改变现有 `font-sans` / `font-display` / `font-mono` / `font-sf-pro-*` 定义。
- 艺术字体仅用于 kicker，不用于正文、标题、按钮。
- 每个新字体只加载单字重（weight: 400），`next/font` 自动子集化。
- `PageActHeader` 的 `kickerFont` 为可选 prop，不传时保持现有 `font-medium`，向后兼容。

---

### Task 1: 在 layout.tsx 注册 4 个艺术字体

**Files:**
- Modify: `frontend/src/app/layout.tsx`

- [ ] **Step 1: 添加字体 import**

在 `layout.tsx` 第 3 行，将现有 import 扩展为包含 4 个新字体：

```tsx
import { Inter, Syne, Manrope, Cinzel, Fraunces, DMSerifDisplay, Abril_Fatface } from 'next/font/google';
```

- [ ] **Step 2: 注册字体实例并声明 CSS 变量**

在第 15-17 行（现有 inter/syne/manrope 定义之后）追加 4 个字体定义：

```tsx
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const syne = Syne({ subsets: ['latin'], variable: '--font-syne' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

// 分页面艺术字体（仅 kicker/装饰用；单字重 400，next/font 自动子集化）
const cinzel = Cinzel({ subsets: ['latin'], weight: '400', variable: '--font-cinzel' });
const fraunces = Fraunces({ subsets: ['latin'], weight: '400', variable: '--font-fraunces' });
const dmSerif = DMSerifDisplay({ subsets: ['latin'], weight: '400', variable: '--font-dm-serif' });
const abril = Abril_Fatface({ subsets: ['latin'], weight: '400', variable: '--font-abril' });
```

- [ ] **Step 3: 在 body 注入新 CSS 变量**

在第 91 行 `<body>` className 追加 4 个变量：

```tsx
<body className={`${inter.variable} ${syne.variable} ${manrope.variable} ${cinzel.variable} ${fraunces.variable} ${dmSerif.variable} ${abril.variable} font-sans bg-background`}>
```

- [ ] **Step 4: 验证 type-check 通过**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 错误（`next/font/google` 的字体名是合法导出）。

- [ ] **Step 5: 提交**

```bash
git add frontend/src/app/layout.tsx
git commit -m "feat(fonts): register 4 artistic fonts in root layout"
```

---

### Task 2: 在 tailwind.config.js 新增 4 个语义字体类

**Files:**
- Modify: `frontend/tailwind.config.js:36-41`

- [ ] **Step 1: 扩展 fontFamily**

将现有 fontFamily 对象（第 36-41 行）替换为：

```js
fontFamily: {
  sans: ['var(--font-manrope)', 'var(--font-inter)', 'ui-sans-serif', 'system-ui'],
  display: ['var(--font-syne)', 'var(--font-inter)', 'ui-sans-serif', 'system-ui'],
  'sf-pro-display': ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
  'sf-pro-text': ['"SF Pro Text"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
  // 分页面艺术字体（仅 kicker/装饰用，回退到 display 字体 Syne + serif）
  tarot: ['var(--font-cinzel)', 'var(--font-syne)', 'serif'],
  creative: ['var(--font-fraunces)', 'var(--font-syne)', 'serif'],
  gallery: ['var(--font-dm-serif)', 'var(--font-syne)', 'serif'],
  cinema: ['var(--font-abril)', 'var(--font-syne)', 'serif'],
},
```

- [ ] **Step 2: 验证 Tailwind 配置无语法错误**

Run: `cd frontend && npx tailwindcss --help > /dev/null 2>&1; node -e "require('./tailwind.config.js'); console.log('config OK')"`
Expected: `config OK`（config.js 可被 Node 正常 require）。

- [ ] **Step 3: 提交**

```bash
git add frontend/tailwind.config.js
git commit -m "feat(fonts): add 4 page-specific font classes to tailwind config"
```

---

### Task 3: PageActHeader 新增 kickerFont prop

**Files:**
- Modify: `frontend/src/components/layout/PageActHeader.tsx`

- [ ] **Step 1: 在 props 接口新增 kickerFont 字段**

在第 8-18 行的 `PageActHeaderProps` interface 中，`children` 之前新增：

```tsx
export interface PageActHeaderProps {
  /** 幕标小字（ eyebrow ），如「第五幕 · 影音」或英文 kicker */
  kicker?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  align?: 'center' | 'left';
  className?: string;
  /** kicker 艺术字体类（如 font-tarot / font-creative），不传则用默认 font-medium */
  kickerFont?: string;
  /** 标题下方额外内容（徽章、统计等） */
  children?: ReactNode;
}
```

- [ ] **Step 2: 解构 kickerFont 并应用到 kicker 渲染**

在函数签名（第 26-34 行）解构 `kickerFont`：

```tsx
export default function PageActHeader({
  kicker,
  title,
  description,
  icon: Icon,
  align = 'center',
  className,
  kickerFont,
  children,
}: PageActHeaderProps) {
```

将 kicker `<p>` 标签（第 45-52 行）的 className 替换为条件合并。注意：引入 `cn` 工具函数（文件顶部已有 `import { cn } from '@/lib/utils'`，无需新增 import）：

```tsx
{kicker ? (
  <p
    data-act-kicker
    className={cn(
      'text-[11px] sm:text-xs tracking-[0.28em] text-white/80',
      kickerFont ?? 'font-medium'
    )}
  >
    {kicker}
  </p>
) : null}
```

- [ ] **Step 3: 验证 type-check 通过**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 错误。

- [ ] **Step 4: 验证现有测试无回归**

Run: `cd frontend && npx jest --silent --testPathPattern="tarot-content|image-gen-content|albums|videos" 2>&1 | tail -5`
Expected: 所有现有测试通过（kickerFont 未传时保持原有行为）。

- [ ] **Step 5: 提交**

```bash
git add frontend/src/components/layout/PageActHeader.tsx
git commit -m "feat(PageActHeader): add optional kickerFont prop for artistic fonts"
```

---

### Task 4: 4 个页面传入各自艺术字体类

**Files:**
- Modify: `frontend/src/app/tools/tarot/tarot-content.tsx`
- Modify: `frontend/src/app/tools/image-gen/image-gen-content.tsx`
- Modify: `frontend/src/app/albums/albums-content.tsx`
- Modify: `frontend/src/app/videos/videos-content.tsx`

- [ ] **Step 1: 塔罗页传入 font-tarot**

在 `tarot-content.tsx` 的 `<PageActHeader>` 调用（约第 358-365 行），在 `align="center"` 之后加一行：

```tsx
<PageActHeader
  kicker="塔罗占卜 · TAROT"
  title="塔罗占卜"
  description="抽牌占卜，正逆位牌义与 AI 深度解读"
  icon={MoonStar}
  align="center"
  kickerFont="font-tarot"
  className="[&_[data-act-kicker]]:text-primary [&_h1]:text-foreground [&_p]:text-muted-foreground"
/>
```

- [ ] **Step 2: 生图页传入 font-creative**

在 `image-gen-content.tsx` 的 `<PageActHeader>` 调用（约第 400-407 行），加 `kickerFont="font-creative"`：

```tsx
<PageActHeader
  kicker="AI 生成 · CREATIVE STUDIO"
  title="图片 · 视频生成"
  description="输入提示词，AI 帮你生成图片或视频"
  icon={kind === 'video' ? Clapperboard : ImageIcon}
  align="center"
  kickerFont="font-creative"
  className="[&_[data-act-kicker]]:text-primary [&_h1]:text-foreground [&_p]:text-muted-foreground"
/>
```

- [ ] **Step 3: 相册页传入 font-gallery**

在 `albums-content.tsx` 的 `<PageActHeader>` 调用（约第 257-262 行），加 `kickerFont="font-gallery"`：

```tsx
<PageActHeader
  kicker="相册 · ALBUMS"
  title="我的相册"
  description="探索生活中的美好瞬间 · 用镜头记录难忘时刻"
  kickerFont="font-gallery"
  className="mb-8"
/>
```

- [ ] **Step 4: 视频页传入 font-cinema**

在 `videos-content.tsx` 的 `<PageActHeader>` 调用（约第 157-161 行），加 `kickerFont="font-cinema"`：

```tsx
<PageActHeader
  kicker="放映厅 · VIDEOS"
  title="我的视频"
  description="记录您的电影、剧集和动漫之旅"
  kickerFont="font-cinema"
/>
```

- [ ] **Step 5: 验证 type-check 与测试**

Run: `cd frontend && npx tsc --noEmit && npx jest --silent --testPathPattern="tarot-content|image-gen-content" 2>&1 | tail -5`
Expected: type-check 0 错误；测试全部通过。

- [ ] **Step 6: 提交**

```bash
git add frontend/src/app/tools/tarot/tarot-content.tsx frontend/src/app/tools/image-gen/image-gen-content.tsx frontend/src/app/albums/albums-content.tsx frontend/src/app/videos/videos-content.tsx
git commit -m "feat(fonts): apply page-specific artistic fonts to 4 page kickers"
```

---

### Task 5: 全量验证与构建

**Files:**
- 无新增修改，仅验证

- [ ] **Step 1: 全量测试**

Run: `cd frontend && npx jest --silent 2>&1 | tail -5`
Expected: 全部测试通过。

- [ ] **Step 2: lint + type-check**

Run: `cd frontend && npm run lint && npx tsc --noEmit`
Expected: lint 0 error；type-check 0 错误。

- [ ] **Step 3: 生产构建**

Run: `cd frontend && npm run build 2>&1 | tail -15`
Expected: 构建成功，4 个页面正常产出；`next/font` 字体文件被正确打包（无字体下载失败警告）。

- [ ] **Step 4: 启动 dev server 抽查 4 个页面**

Run: `cd frontend && npm run dev`，访问 `/tools/tarot`、`/tools/image-gen`、`/albums`、`/videos`。

Expected: 4 个页面 kicker 分别呈现各自艺术字体气质；正文与标题字体不变；无控制台字体加载错误。

- [ ] **Step 5: 最终 diff 检查**

```bash
git diff --check
git status --short
git log --oneline -6
```

Expected: 无空白错误；改动仅限 layout.tsx / tailwind.config.js / PageActHeader.tsx / 4 个页面文件。

---

## 自检结果

- **spec §2 字体分配**：Task 1（注册）+ Task 2（tailwind 映射）+ Task 4（页面传入）完整覆盖。
- **spec §3.3 PageActHeader prop**：Task 3 完整实现。
- **spec §5 性能与可访问性**：Task 5 构建验证 + dev 抽查覆盖。
- **无占位符**：所有步骤含完整代码。
- **类型一致**：`kickerFont?: string` 在 Task 3 定义、Task 4 使用，签名一致。
