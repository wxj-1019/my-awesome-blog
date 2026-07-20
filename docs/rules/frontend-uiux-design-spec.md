# 前端 UI/UX 设计规范（My Awesome Blog 项目版）

> 版本：v2.0 · 2026-07
> 本文件是项目前端设计的**落地事实来源**，在通用《前端 UI/UX 设计规范 v1.0》的基础上，
> 按本项目实际技术栈与「深海 × 电影」设计语言定制。与代码冲突时，以本文件与
> `docs/rules/ui-design-rules.md`、`docs/rules/frontend-rules.md` 为准。
> 最后更新：2026-07-20

---

## 目录

1. [设计哲学](#1-设计哲学)
2. [技术栈与工程基座](#2-技术栈与工程基座)
3. [设计令牌 Design Tokens](#3-设计令牌-design-tokens)
4. [主题与背景系统](#4-主题与背景系统)
5. [布局规范](#5-布局规范)
6. [动效规范](#6-动效规范)
7. [组件设计规范](#7-组件设计规范)
8. [可访问性规范](#8-可访问性规范)
9. [代码严谨性规范](#9-代码严谨性规范)
10. [性能预算](#10-性能预算)
11. [交付检查清单](#11-交付检查清单)

---

## 1. 设计哲学

### 1.1 深海 × 电影（项目叙事主线）

本站是一个「下潜」故事：**片头（Hero）→ 入水（Dive）→ 分幕（展厅 → 仪表 → 洋流）→ 靠岸（Shore）**。
所有视觉决策服务于这条叙事线：

- 光是主角：浅色是「白昼浅海」（日光柱、云影），深色是「夜海深潜」（月光、生物荧光）。
- 幕与幕之间用「接续引线 + 幕标视差」串联，不用硬切换打断沉浸感。
- 每个页面是一个「幕」：页头统一用幕标式 `PageActHeader`（kicker 小字 + 渐变引线）。

### 1.2 克制的惊艳（Restrained Delight）

- 每个动效必须回答"它帮助用户理解了什么"，答不上来就删掉。
- 惊艳感来自细节精度（1px 边框、恰好的缓动、精确的留白节奏），不来自效果数量。
- 一个页面只允许 **1 个"哇点"**（首页是 Dive 入水 scrub），其余保持安静。

### 1.3 空间深度（Atmospheric Depth）

- 玻璃拟态（Glassmorphism）：半透明 + 背景模糊 + 1px 半透边框，是本站表面材质的默认语言。
- 彩色漫射阴影（`--shadow-tech-cyan` 等带品牌色相的投影）替代生硬黑影。
- 视差只给叙事层（幕标、接续引线），内容层保持静止——**静态 70% + 滚动 30%**。

### 1.4 动效即意义（Motion = Meaning）

- 功能型微交互优先于装饰型动效。
- 尊重 `prefers-reduced-motion`，这是底线而非选项（见 §6.5 强制回退表）。

### 1.5 代码即设计（Code as Design）

- 设计令牌是唯一事实来源：`variables.css` 的 CSS 变量，不存在第二份颜色定义。
- 组件即契约：Props interface 就是组件的设计稿标注。
- 不存在魔法数字——数值必须能追溯到令牌或间距刻度。

---

## 2. 技术栈与工程基座

### 2.1 本项目实际栈

| 层级 | 本项目选型 | 说明 |
|---|---|---|
| 框架 | **Next.js 16.1.6（App Router + Turbopack）** | RSC 优先，公开页 Server `page.tsx` + Client `*-content.tsx` 分离 |
| 语言 | **TypeScript（strict）** | 禁止 `any`，优先 `unknown` + 收窄 |
| 样式 | **Tailwind CSS v3**（`tailwind.config.js`，`darkMode: 'class'`） | **注意：本项目不是 v4**，令牌走 CSS 变量 + config 映射，不用 `@theme` |
| 组件基座 | 自研 `components/ui/`（GlassCard 体系）+ Radix 无头原语 | shadcn 风格但已项目化，详见 §7 |
| 组件动效 | **framer-motion**，唯一入口 `@/lib/framer-motion` | 业务代码禁止直接 import 'framer-motion'；优先用 `@/components/motion` 封装 |
| 滚动叙事 | **GSAP + ScrollTrigger**，经 `@/lib/gsap/registry` 的 `ensureGsapPlugins()` + `useGSAP` | 仅用于 Dive 入水 scrub 等连续时间线 |
| 图标 | **Lucide** | 统一线性风格 |
| 测试 | **Jest + Testing Library + axe-core**（`__tests__/a11y/`） | 不是 Vitest |
| 规范工具 | ESLint（`.eslintrc.cjs`）+ Prettier + Husky/lint-staged | `npm run lint` 必须 0 error |

### 2.2 动效库引入原则

- 默认：`@/components/motion` 封装（FadeIn / BlurIn / Stagger / HoverLift / ModalMotion）。
- 需要精确 scrub 的连续时间线（如 DiveTransition）才用 GSAP。
- 不引入 Lenis、不引入 R3F——本站无平滑滚动库与 WebGL 场景，新增需评审。

---

## 3. 设计令牌 Design Tokens

### 3.1 令牌架构（单一事实来源）

```
styles/base/variables.css   ← 唯一颜色定义（:root = 浅色，.dark = 深色覆盖）
tailwind.config.js          ← 把 CSS 变量映射为 Tailwind 类
组件                        ← 只消费 Tailwind 语义类，禁止裸 hex / isDark 分支
```

> **历史教训**：`:root` 与 `.light` 曾双份定义导致 `--primary` 漂移（#0ea5e9 vs #0284c7）、
> 首屏品牌色闪烁。现在 **`:root` 即浅色主题，`.light` 不再重复定义**。

### 3.2 色彩系统

**品牌色 · 科技青**（浅色压深保对比，深色提亮保识别）：

| 令牌 | 浅色（:root） | 深色（.dark） | 用途 |
|---|---|---|---|
| `--primary` | `#0284c7` | `#5eead4` | 主 CTA、激活态、焦点环、kicker |
| `--background` / `--foreground` | `#f4f6f8` / `#0f172a` | `#0c1220` / `#d8e0ea` | 页面底 / 正文 |
| `--card` | `#ffffff` | `rgba(15,23,42,0.9)` | 卡片表面 |
| `--muted-foreground` | `#475569` | `#cbd5e1` | 辅助文字 |
| `--border` / `--ring` | `#d8e0e8` / `#7dd3fc` | `rgba(94,234,212,0.18)` / `#5eead4` | 描边 / 焦点环 |

**tech 装饰色系**（仅装饰，强调优先用 `primary`）：

`--tech-darkblue #0c4a6e` · `--tech-deepblue #075985` · `--tech-cyan`（跟随 primary）· `--tech-lightcyan` · `--tech-sky` · `--tech-purple` · `--tech-pink`

**玻璃材质**：

| 令牌 | 浅色 | 深色 |
|---|---|---|
| `--glass-default` | `rgba(255,255,255,0.96)` | `rgba(15,23,42,0.9)` |
| `--glass-border` | `rgba(14,165,233,0.2)` | `rgba(94,234,212,0.2)` |
| `--glass-glow` | `rgba(14,165,233,0.16)` | `rgba(94,234,212,0.2)` |

**状态色**：`--success` / `--warning` / `--error`（= `--destructive`）/ `--info`，全部双主题定义，组件直接用 `bg-success`、`text-destructive` 等。

**色彩规则**：
- 页面构成 = 60% 中性背景 + 30% 玻璃表面 + 10% 品牌色点缀。
- 渐变仅用于氛围背景与氛围按钮（`from-tech-cyan to-tech-sky`），正文文字禁止渐变。
- 正文/背景对比度 ≥ 4.5:1；装饰透明度用 `color-mix(in srgb, var(--x) N%, transparent)`。

### 3.3 字体系统

- 正文：`font-sans`（Manrope + Inter + PingFang/Noto 回退）
- 展示标题：`font-display`（Syne）
- 苹果风排版：`font-sf-pro-display` / `font-sf-pro-text`
- 等宽：`font-mono`（GlitchText、kicker 可用）

**字号阶梯**（macOS 语义阶梯，定义于 tailwind.config）：
`text-large-title` / `text-title-1` / `text-title-2` / `text-title-3` / `text-body` / `text-callout` / `text-subhead` / `text-footnote` / `text-caption-1/2`

**排版规则**：
- 正文行高 1.7（`.prose p` 已配 `leading-relaxed md:leading-[1.8]`），标题 1.35 以内。
- 幕标 kicker：`text-[11px] sm:text-xs font-medium tracking-[0.28em] text-primary/90`。
- 数字用 `tabular-nums` 防跳动；单行最长约 68 字符。

### 3.4 间距与圆角

- **4px 基准网格**；区块纵向节奏：内容页 `pt-24` 顶距（避开 `fixed h-16` 导航）+ `pb-12/16`。
- 卡片内边距：`p-4` / `p-6`（GlassCard `padding="sm|md|lg"`）。
- **圆角（macOS 阶梯）**：`rounded-macos-xs`(8) → `sm`(12) → `md`(16) → `lg`(20) → `xl`(24) → `2xl`(32) → `3xl`(40)；基础 `--radius: 0.85rem`。
- 嵌套圆角：外圆角 ≈ 内圆角 + padding（视觉同心）。

### 3.5 阴影与纵深

- 层级阴影：`shadow-macos-1` ~ `shadow-macos-5`；玻璃阴影：`shadow-macos-glass-1` ~ `3`。
- 品牌辉光：`shadow-tech-cyan`（`0 0 15px var(--shadow-tech-cyan)`），大辉光用 `shadow-[0_0_30px_var(--shadow-tech-cyan)]`。
- 层级提升时机：hover / focus / 浮层；暗色下阴影让位于「表面提亮 + 1px 半透边框」。

---

## 4. 主题与背景系统

### 4.1 主题切换

- 三模式：`light` / `dark` / `auto`，`ThemeProvider` + `layout.tsx` 头部 FOUC 脚本预置 `html.light|dark`。
- 切换写入 `localStorage` + `<meta name="theme-color">` 同步。
- **禁止** `isDark ? A : B` 色值分支——用语义 token 单值，双主题自适应。

### 4.2 全局动态背景（AmbientBackground）

`components/visual/AmbientBackground.tsx`：**两套主题层常驻 DOM，纯 CSS 按 `html.light/.dark` 切换**，无 JS 分支、无闪烁。

- **浅色 · 白昼浅海**：顶部天光 + 日光柱 ×2（`skewX` 摇曳 24s/30s 错峰）+ 云影光斑漂移（36s）。
- **深色 · 夜海深潜**：月光光斑 ×2 错峰漂移（26s/32s）+ 静态月柱 + 生物荧光点（桌 12 / 移 6，伪随机稳定）。
- 公共层：水体渐变基底 + 稀疏气泡（桌 6 / 移 3，无高光）+ 噪点。
- 约束：`fixed -z-10 pointer-events-none aria-hidden`，只动 transform/opacity，reduced-motion 全静态。

### 4.3 页面背景原则

页面**不再铺底色**，让全局背景透出；局部需要氛围时用 `color-mix` token 渐变装饰
（参考 `DepthAmbience` 的分幕环境层）。禁止整页写死深色渐变（albums 已整改）。

---

## 5. 布局规范

### 5.1 容器与网格

- 标准容器：`container mx-auto px-4 sm:px-6 lg:px-8`。
- 内容页外壳统一 `PageShell`（`density: default | narrow | flush`），**默认 `as="div"`**——根 layout 已有 `<main>`，禁止嵌套 landmark。
- 自由布局必须能映射回网格，错位是跨列而非脱网。

### 5.2 页面头部（二选一，禁止自写第三种）

| 场景 | 组件 | 形态 |
|---|---|---|
| 叙事内容页 | **`PageActHeader`** | kicker 幕标小字 + 图标(可选) + 标题 + 描述 + 渐变引线，自带 FadeIn |
| hub 导航页 | **`PageHeader`**（配 PageShell） | 图标块 + 标题 + 描述，居中 |

> articles 页是特许例外：保留 GlitchText 赛博大标题，但下方加同款 kicker 呼应幕标。

### 5.3 首页分幕布局（叙事基座）

```
HeroSection（片头，不改）
  → DiveTransition（入水装置：三层色带 + 折光线 + 光柱×3 + 残影气泡，GSAP scrub）
  → HomeActSection 第一幕 · 展厅（depth=shallow）
  → HomeActSection 第二幕 · 仪表（depth=cabin）
  → HomeActSection 第三幕 · 洋流（depth=current，含数据航迹 + 历程时间线）
  → HomeActSection 第四幕 · 靠岸（depth=shore，ShoreBeacon，无订阅表单）
```

- 幕标中文（「第 N 幕 · XX」），`HomeActSection` 渲染普通 div + `data-act`。
- 共享节奏集中在 `components/home/narrative/homeMotion.ts`（HOME_* 常量），改节奏只改这里。

### 5.4 响应式断点

`xs:475` `sm:640` `md:768` `tab:834` `lg:1024` `xl:1280` `2xl:1536`

- 移动优先；触摸目标 ≥ 44×44px。
- 桌面专属的视差/光柱/多微粒，移动端降档或静态（`useEffect` + `matchMedia('(min-width: 768px)')` 判定）。

---

## 6. 动效规范

### 6.1 动效令牌（事实来源：`lib/animation-utils.ts` + `homeMotion.ts`）

```ts
EASE = {
  SMOOTH: [0.4, 0, 0.2, 1],        // 默认入场/页面
  SNAPPY: [0.22, 1, 0.36, 1],      // 微交互
  APPLE:  [0.25, 0.1, 0.25, 1],    // 硬件加速友好
  SPRING: { stiffness: 220, damping: 32 },
}
TRANSITION = { MICRO: 0.24, FAST: 0.28, DEFAULT: 0.48, SLOW: 0.7 }
HOME_DURATION = { act: 0.55, content: 0.5, dive: 0.9, waveEnter: 1.1, reelSnap: 0.45 }
HOME_STAGGER = 0.08
```

**硬性规则**：
- UI 反馈 ≤ 300ms（MICRO/FAST）；入场/转场 ≤ 500ms；叙事 scrub 不限时但须连续。
- **只动画 `transform` 和 `opacity`**。禁止 `width/height/top/left/margin` 动画——
  尺寸变化用 `scaleX/scaleY + origin`，折叠用 grid-rows `[0fr→1fr]` 方案。
- 手写 `transition={{ duration }}` 必须取自 TRANSITION/HOME_DURATION，不拍脑袋写数值。

### 6.2 动效分级与预算

| 级别 | 内容 | 本项目预算 |
|---|---|---|
| L0 | reduced-motion | 无循环、无 drift、路径满绘、气泡不渲染 |
| L1 | 移动端 | 卷轴 snap 横滑；洋流静态线；Dive 光柱静态；微粒减半 |
| L2 | 桌面 | 焦点景深 + 洋流描边进度 + Dive scrub + 幕标视差/接续引线 |

**持续循环白名单（只有这些允许无限循环）**：
- 浪：`WaveStack`（Hero 出口，唯一「浪」）
- 气泡：`BubbleField` 三级——Hero（桌16/移8）、Dive（桌8/移4 无高光）、全局 Ambient（桌6/移3 无高光）
- 生物荧光点（AmbientBackground 深色层，桌12/移6）
- **禁止**第四路无限循环：无矩阵雨、无 Reel 自动漂移、无每幕光扫

### 6.3 标准动效模式

- **入场**：统一 `@/components/motion`——`FadeIn`（y:10→0 + opacity）、`BlurIn`、`Stagger/StaggerItem`（单方向、间隔 0.08s）、`HoverLift`（hover 浮起）。
- **滚动叙事**：幕标视差（`useScroll` target + `useTransform`，±28px）+ 接续引线（`scaleY` 随进度垂落）。
- **共享元素转场**：列表→详情用 `layoutId`（games 页已用；reduced 时 `layoutId={undefined}`）。
- **GSAP scrub**：opacity/y 只由 GSAP 写入（单一来源，禁止与 Tailwind opacity 类叠乘），初值 inline 0 防闪烁。

### 6.4 hover 浮起规格（全站统一）

交互卡片 hover：`-translate-y-1`（约 -4px）+ 阴影提升 + `border-primary/40`，过渡 200–300ms。
优先用 `HoverLift`，不要自写第三种幅度。

### 6.5 reduced-motion 强制回退表

| 正常 | reduced 时 |
|---|---|
| 循环旋转/呼吸/漂浮 | 静态终态或不渲染 |
| 弹幕引擎 rAF | 不启动调度循环 |
| scrub / 视差 | 静态终态（GSAP 直接 set 终值） |
| layoutId 共享转场 | `layoutId={undefined}` |
| 入场位移 | 仅 opacity 或直接渲染（motion 封装已内置） |

---

## 7. 组件设计规范

### 7.1 组件分层（本项目实际结构）

```
components/
├── ui/            # 基座：GlassCard、Button、Badge、EmptyState、LoadingState...
├── layout/        # 壳：PageShell、PageHeader、PageActHeader、MasonryGrid...
├── motion/        # 动效封装：FadeIn、BlurIn、Stagger、HoverLift、ModalMotion
├── navigation/    # Navbar、QuickNav、Footer...
├── home/          # 首页（含 narrative/ 叙事层、stats/）
├── visual/        # AmbientBackground 等全局视觉层
└── <domain>/      # articles、music、videos、messages... 领域组件
```

### 7.2 组件状态完备性（验收红线）

交互组件交付必须具备：**default / hover / focus-visible / active / disabled / loading / error**。

- `focus-visible`：全局已兜底（`globals.css`：`ring-2 ring-ring ring-offset-2`），组件不要另起第三套焦点色。
- 可点击卡片用 `<button>`/`<Link>` 或补 `tabIndex + role + onKeyDown`——禁止 `cursor-pointer` 的裸 div。
- `error`：图标 + 文字（`text-destructive`），不允许仅用红色。
- 空态三要素：图形 + 一句话 + 行动按钮（参考 `EmptyState.tsx` 范本，含 reduced-motion 回退）。

### 7.3 重点组件

**GlassCard**（表面材质基座，37+ 处引用）
- 玻璃卡一律用它，禁止手写 `bg-glass/30 backdrop-blur-xl border-glass-border` 散件。
- `hoverEffect` 统一浮起；`padding="sm|md|lg"`。

**Button**
- 层级：primary（`bg-primary text-primary-foreground`，一屏 ≤2 个）→ outline → ghost。
- 主按钮色全站统一 `bg-primary`，禁止再写 `bg-tech-cyan` 按钮（token 已对齐）。

**PageActHeader / PageHeader / PageShell**
- 见 §5.2，页头二选一；kicker 格式「中文 · ENGLISH」。

**DataTable / GlassCardAdmin（admin 体系）**
- ⚠️ 当前仍是 slate 硬编码，属已知债，改动时顺手 token 化（`bg-glass`/`border-glass-border`）。

### 7.4 媒体与图片

- 可控来源图片用 `next/image`；外部不可控来源保留 `<img>` 并加中文注释说明。
- 列表 key 用稳定 id/slug，禁止 index（静态骨架屏除外并加注释）。

---

## 8. 可访问性规范

按 **WCAG 2.2 AA** 执行，CI 以 axe-core 把关（`__tests__/a11y/`）：

1. 语义先行：能 `<button>` 不 `<div onClick>`；标题不跳级；地标完整（根 layout 已提供唯一 `<main id="main-content">`）。
2. 键盘全覆盖：Tab 可达、焦点可见（全局 `:focus-visible` 兜底）、模态焦点圈禁 + Esc 关闭 + 焦点还原。
3. 跳过链接：`.skip-link` 已全局配置，新页面不要破坏 `main-content` 锚点。
4. 对比度：正文 ≥ 4.5:1；玻璃上的文字用 `text-foreground`/`text-muted-foreground`，不要在深色渐变上直接放浅灰字。
5. 动效降级：见 §6.5 回退表。
6. 图片 `alt` 有意义，装饰图 `alt=""` 或 `aria-hidden`；纯装饰层统一 `aria-hidden + pointer-events-none`。
7. 验收：a11y 测试套件 0 critical/serious 违规。

---

## 9. 代码严谨性规范

### 9.1 TypeScript

- `strict` 全开；**零 `any`**（存量 warning 逐步清缴），用 `unknown` + 收窄。
- Props 用 `interface` 显式导出并写中文注释——Props 即组件文档。

### 9.2 文件与命名

- 页面：`page.tsx`（Server，导 metadata）+ `*-content.tsx`（Client）分离。
- 组件 `PascalCase.tsx`，hook `useXxx.ts`，常量 `SCREAMING_SNAKE`。
- 路径别名 `@/*`（指向 `src/`）；动效只从 `@/lib/framer-motion` 或 `@/components/motion` 导入。

### 9.3 样式纪律

- 颜色/阴影/圆角 100% 来自令牌；`style` 内联只允许动态 CSS 变量（光标坐标、`--drift` 等）。
- 装饰层三件套：`pointer-events-none` + `aria-hidden` + 注释说明用途。
- styled-jsx 仅用于 keyframes 与主题层切换（`:global(.light)` 选择器），不用于布局样式。

### 9.4 React 纪律

- RSC 优先，`'use client'` 下沉到叶子。
- GSAP 必须 `useGSAP` + scope；滚动监听必须节流/rAF + 清理。
- `useEffect` 依赖诚实填写；定时器/监听器/IO 全部清理。

### 9.5 提交与评审

- Conventional Commits；视觉变更 PR 附截图 + a11y 自查。
- 提交前本地四道闸：`npm run type-check` → `npm run lint`（0 error）→ `npm test` → `npm run build`。

---

## 10. 性能预算

| 指标 | 预算 | 本项目措施 |
|---|---|---|
| LCP | ≤ 2.0s | Hero 视频懒加载（IntersectionObserver 触发）、`next/image` priority |
| INP | ≤ 200ms | 动效只走合成层；滚动监听节流（`HOME_CURRENT.progressThrottle: 32ms`） |
| CLS | ≤ 0.05 | 图片声明宽高、骨架屏占位、视频容器定高 |
| DOM 预算 | 装饰节点从简 | 气泡/荧光分级减量，水下段省略高光 |
| 动画 | 稳定 60fps | 只动 transform/opacity；`will-change` 谨慎用 |

- 装饰性大背景：CSS 渐变优先于图片；必须用的图片压缩后 ≤ 150KB。
- 弹幕等高频场景：WAAPI + rAF 调度，reduced-motion 整体关闭。

---

## 11. 交付检查清单

**设计走查**
- [ ] 页面只有一个主创意点，其余安静
- [ ] 页头用了 PageActHeader 或 PageHeader（无第三种自写）
- [ ] 所有颜色/阴影/圆角可追溯至令牌（grep 无裸 hex、无 `dark:` 双色分支）
- [ ] 浅色与深色各过一眼（玻璃上文字可读、无写死深色背景）

**动效走查**
- [ ] 每个动效能回答"表达了什么"
- [ ] 只动 transform/opacity；循环动画在白名单内
- [ ] reduced-motion 下完整可用（按 §6.5 逐项核对）
- [ ] duration/easing 取自 TRANSITION/HOME_* 令牌

**工程走查**
- [ ] `npm run type-check` / `npm run lint` / `npm test` / `npm run build` 全绿
- [ ] 交互组件 7 态齐备；axe 0 critical/serious
- [ ] 无整页 `'use client'`；GSAP 有 useGSAP 清理

---

## 附：与通用规范 v1.0 的主要差异说明

| 通用规范 | 本项目实际 | 原因 |
|---|---|---|
| Tailwind v4 `@theme` + OKLCH | Tailwind v3 config + CSS 变量 hex | 项目存量栈，迁移另行评估 |
| Vitest | Jest | 存量工具链 |
| shadcn/ui 未改原貌 | 已项目化的 `components/ui/` | 玻璃拟态定制深 |
| Lenis 平滑滚动 | 不引入 | 深海叙事靠 scrub 已足够，避免滚动劫持 |
| Bento 2.0 活性网格 | 分幕叙事 + MasonryGrid | 博客内容形态决定 |
| 组件分 ui/primitives/patterns/effects | ui/layout/motion/\<domain\> | 项目实际分层，已稳定 |
