# UI / 设计系统规则

> 适用于所有前端 UI 组件、样式、动画、主题相关代码。新增或修改组件前必须阅读本文件。  
> 全局铁律见 [AGENTS.md](../../AGENTS.md)；工程约定见 [frontend-rules.md](./frontend-rules.md)。  
> 最后更新：2026-07-20

## 1. 设计语言

本项目采用**玻璃拟态（Glassmorphism）+ 科技风格**设计系统：

- 半透明背景 + 背景模糊
- 青色/蓝色科技光晕
- 深色模式为主，支持浅色模式
- 精致的微交互动画
- Apple / macOS 风格的圆角与排版

## 2. 主题系统

> 详细约定见 [docs/theme-tokens.md](../theme-tokens.md)。当前阶段：**统一 light/dark 语义 token，暂不第二套皮肤**。

### 2.1 主题模式
- 支持 `light`、`dark`、`auto` 三种模式。
- 主题通过 CSS class `light`/`dark` 切换（`ThemeProvider` + FOUC 脚本）。
- `darkMode: 'class'` 配置在 `tailwind.config.js`。
- 初始化脚本在 `frontend/src/app/layout.tsx` 的 `<head>` 中。

### 2.2 CSS 变量（权威来源）
- 颜色变量定义在 **`frontend/src/styles/base/variables.css`**（`:root` / `.light` / `.dark`）。
- Tailwind 映射在 `frontend/tailwind.config.js` 的 `theme.extend.colors`。
- 关键语义变量：
  - `--background` / `--foreground`
  - `--primary` / `--primary-foreground`
  - `--card` / `--card-foreground`
  - `--muted` / `--muted-foreground`
  - `--border` / `--ring` / `--input`
  - `--destructive`（与 error 对齐）
  - `--glass-default` / `--glass-border` / `--glass-glow`
  - `--tech-cyan` 等品牌色（优先用 `primary`，tech-* 仅装饰）

### 2.3 使用方式
```tsx
// ✅ 语义 token（推荐）
<div className="bg-background text-foreground">
  <GlassCard className="bg-card border-border">内容</GlassCard>
  <p className="text-muted-foreground">辅助文字</p>
</div>

// ❌ 禁止新代码再写亮暗双分支色值
// isDark ? 'text-cyan-300' : 'text-blue-600'
```

### 2.4 兼容与废弃
- `useThemedClasses()`：存量 `cardBgClass` 等已映射到语义类；**新组件尽量不用**。
- `getThemeClass(dark, light)`：迁移期可用，**禁止扩大使用面**。
- 将来加皮肤：只加 CSS 变量覆盖（`data-theme-pack`），不改业务组件分支。

## 3. 颜色系统

### 3.1 主要颜色
- **科技深蓝**: `tech-darkblue` (#0f172a)
- **科技蓝**: `tech-deepblue` (#1e3a8a)
- **青色**: `tech-cyan` (#06b6d4)
- **亮青色**: `tech-lightcyan` (#22d3ee)
- **天空蓝**: `tech-sky` (#0ea5e9)

### 3.2 状态颜色
- Success: `text-success bg-success`
- Warning: `text-warning bg-warning`
- Error: `text-error bg-error`
- Info: `text-info bg-info`

### 3.3 使用规范
- 背景使用 `bg-background` 或 `bg-glass/30`。
- 文字使用 `text-foreground`、`text-primary`、`text-secondary`、`text-muted`。
- 强调色使用 `text-tech-cyan` 或 `text-primary`。
- 禁止使用裸十六进制颜色（除非在 tailwind 配置中已定义）。

## 4. 玻璃拟态组件

### 4.1 基础组合
```tsx
<div className="
  bg-glass/30
  backdrop-blur-xl
  border border-glass-border
  rounded-macos-lg
  shadow-macos-glass-2
">
```

### 4.2 透明度层级
- 低层级：`bg-glass/20`
- 中层级：`bg-glass/30`（最常用）
- 高层级：`bg-glass/50`
- 悬浮面板：`bg-glass/70`

### 4.3 边框与光晕
- 边框：`border-glass-border`
- 光晕：`shadow-macos-glass-*` 或 `animate-pulse-glow`

## 5. 排版系统

### 5.1 字体
- 正文字体：`font-sans`（Manrope + Inter）
- 标题字体：`font-display`（Syne）
- 苹果风格：`font-sf-pro-display`、`font-sf-pro-text`

### 5.2 字体大小
- 大标题：`text-large-title`、`text-title-1`
- 标题：`text-title-2`、`text-title-3`
- 正文：`text-body`、`text-callout`
- 辅助：`text-subhead`、`text-footnote`、`text-caption-1`、`text-caption-2`

### 5.3 行高与字间距
- 使用 tailwind 配置中预定义的 `lineHeight` 和 `letterSpacing`。

## 6. 圆角系统

- 超小：`rounded-macos-xs` (8px)
- 小：`rounded-macos-sm` (12px)
- 中：`rounded-macos-md` (16px)
- 大：`rounded-macos-lg` (20px)
- 超大：`rounded-macos-xl` (24px)
- 2xl：`rounded-macos-2xl` (32px)
- 3xl：`rounded-macos-3xl` (40px)

## 7. 动画系统

### 7.1 入场动画
- `animate-fade-in-up`: 从下方淡入
- `animate-slide-in-left`: 从左侧滑入
- `animate-slide-in-right`: 从右侧滑入
- `animate-scale-fade-in`: 缩放淡入
- `animate-fade-scale-up`: 增强版缩放淡入

### 7.2 持续动画
- `animate-glass-float`: 玻璃卡片悬浮
- `animate-pulse-glow`: 脉冲光晕
- `animate-gradient-move`: 渐变流动
- `animate-float-improved`: 复杂漂浮
- `animate-glow-pulse`:  glow 脉冲

### 7.3 交互动画
- `animate-button-bounce`: 按钮按下反馈
- `animate-ripple`: 涟漪效果
- `animate-sound-wave`: 音波效果

### 7.4 动画使用原则
- 入场动画使用 `forwards` 保持最终状态。
- 不要过度使用持续动画，避免性能问题和视觉疲劳。
- 支持 `prefers-reduced-motion`。

## 8. 间距系统

- 使用 Tailwind 默认间距 + 扩展值。
- 容器：`container mx-auto px-4 sm:px-6 lg:px-8`。
- 区块间距：`py-16 sm:py-20 lg:py-24`。
- 卡片内边距：`p-4`、`p-6`、`p-8`。

## 9. 阴影系统

- `shadow-macos-1` ~ `shadow-macos-5`: 层级阴影
- `shadow-macos-glass-1` ~ `shadow-macos-glass-3`: 玻璃拟态阴影
- `shadow-macos-inset`: 内阴影

## 10. 组件库规范

### 10.1 Radix UI 组件
- 使用 `@radix-ui/react-*` 作为无头组件基座。
- 在 `components/ui/` 中封装项目风格。

### 10.2 自定义组件
- 所有 UI 组件必须支持 `className` 扩展。
- 使用 `cn()` 组合类名。
- 组件必须支持 ref 转发（需要时）。
- 优先使用 `forwardRef` + `HTMLAttributes` 扩展。

### 10.3 组件示例
```tsx
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, hover = false, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-glass/30 backdrop-blur-xl border border-glass-border rounded-macos-lg',
        hover && 'transition-transform duration-300 hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
GlassCard.displayName = 'GlassCard';
```

## 11. 响应式断点

- `xs`: 475px
- `sm`: 640px
- `md`: 768px
- `tab`: 834px（iPad 竖屏）
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## 12. 可访问性

- 确保文字对比度满足 WCAG 标准。
- 所有交互元素必须有 focus 状态。
- 表单输入必须关联 label。
- 图片必须提供 alt 文本。
- 支持键盘导航。
- 尊重 `prefers-reduced-motion`。

## 13. 禁止事项

- ❌ 禁止使用与玻璃拟态风格冲突的实色大背景
- ❌ 禁止过度动画导致性能问题
- ❌ 禁止在组件中硬编码颜色值
- ❌ 禁止破坏响应式布局
- ❌ 禁止忽略暗色/浅色模式适配

## 14. 公开内容页壳

- 内容型公开页（about、hubs、静态说明页等）优先使用：
  - `frontend/src/components/layout/PageShell.tsx` — 背景、顶距、container
  - `frontend/src/components/layout/PageHeader.tsx` — 图标 + 标题 + 描述
- **PageShell 默认 `as="div"`**：根 `layout.tsx` 已有 `<main id="main-content">`，禁止再套一层 main。
- 示例：`frontend/src/app/tools/tools-content.tsx`、`frontend/src/app/about/about-content.tsx`
- 全屏居中页（login）可用 `PageShell contained={false}`。

## 14.1 首页叙事（深海 × 电影）

- 编排：`frontend/src/app/page.tsx` + `components/home/narrative/*`
- 幕标中文（如「第一幕 · 展厅」）；`HomeActSection` 为普通 `div` + `data-act`，避免嵌套 landmark
- 共享节奏：`homeMotion.ts`（act / dive / reel / current / depth / 气泡分级 / 光晕）
- 二期：`FeaturedReel` 胶片卷轴；`TimelineCurrentPath` 洋流描边（自动漂移默认关）
- 三期：第四幕为 `ShoreBeacon` 港口航标（**无订阅表单**）；入口文章/留言/关于 + 回顶
- 四期：`DiveTransition` 多层入水；`DepthAmbience` 分幕环境；展厅顶光/暗角；全局 `AmbientBackground`（`components/visual/`）
- 默认无矩阵雨、无 Reel 自动漂移；须尊重 `prefers-reduced-motion`
- **持续循环预算（多源稀疏气泡，已承认分级）**：
  - 浪：`WaveStack`（Hero 出口，唯一「浪」循环）
  - 气泡：`BubbleField` 多源分级——Hero 出口（桌 16 / 移 8）+ Dive 入水（桌 8 / 移 4，无高光）+ 全局 Ambient（桌 6 / 移 3，无高光）
  - 禁止再增加第四路无限循环（如矩阵雨、每幕光扫、Reel drift）

## 15. 示例参考

- 玻璃卡片：`frontend/src/components/ui/GlassCard.tsx`
- 按钮：`frontend/src/components/ui/Button.tsx`
- 主题配置：`frontend/src/styles/globals.css`
- Tailwind 扩展：`frontend/tailwind.config.js`
- 首页应用：`frontend/src/app/page.tsx`

