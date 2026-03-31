---
trigger: always_on
---

# Design System - My Awesome Blog

## Design Philosophy

My Awesome Blog uses a **Glassmorphism** design language with a **tech-themed color palette**. The design emphasizes:
- Modern, futuristic aesthetics
- Depth through transparency and blur effects
- Smooth, purposeful animations
- High contrast for accessibility
- Responsive, adaptive layouts

## 35条UI优化规则速查表

基于[《UI界面优化改版35个小妙招》](https://www.zcool.com.cn/article/ZMTQ0MDM5Ng==.html)的设计原则，以下是所有规则的快速映射：

| # | 规则名称 | 文档位置 | 代码示例/关键词 |
|---|---------|----------|----------------|
| 1 | 配色黄金比例 60-30-10 | Color Palette → 60-30-10 Rule | `primary-60%` / `secondary-30%` / `accent-10%` |
| 2 | 阴影不是纯黑色 | Shadow Guidelines | `shadow-black/5` |
| 3 | 仅显示重要信息 | Content Visibility | 避免过度隐藏操作 |
| 4 | 使用卡片获得创意 | Common Patterns → Cards | 定价计划场景 |
| 5 | 层级关系 | Typography → Hierarchy | 字号/字重/颜色区分 |
| 6 | 图片元素重叠 | Common Patterns → Overlapping | 头像+卡片重叠 |
| 7 | 空状态 | Empty State Design | 插画+文字+操作 |
| 8 | 图标一致性 | Icon Guidelines | 统一尺寸 `w-6 h-6` |
| 9 | 使用单选按钮 | Form Design → Selection | `< 5选项用radio` |
| 10 | 毛玻璃卡片 | Glassmorphism | `bg-glass/30 backdrop-blur-xl` |
| 11 | 善用图表 | Data Visualization | 数字用图表替代 |
| 12 | 添加背景元素 | Background Design | 渐变/几何形状 |
| 13 | 区别按钮层级 | Button Design Standards | Primary/Secondary/Tertiary |
| 14 | 颜色选择 | Color Usage Rules | 明快轻盈的后台色 |
| 15 | 优先级按钮 | Button Design Standards | 每屏一个主按钮 |
| 16 | 文字识别度 | Typography → Contrast | 文案底色对比 |
| 17 | 卡片间距留白 | Spacing & Composition | `gap-6` 喘息空间 |
| 18 | 视觉对齐 | Typography → Optical Alignment | 字母视觉补偿 |
| 19 | 优先使用按钮 | Content Visibility | 文本标签按钮 |
| 20 | 选择合适字体 | Typography | Inter + 系统字体 |
| 21 | 椭圆矩形/超椭圆 | Common Patterns → Squircle | `rounded-[22%]` |
| 22 | 减少线的使用 | Spacing → Divider Guidelines | 用间距替代分割线 |
| 23 | 英文数字别用中文字体 | Typography → Font Stack | 中英文字体分离 |
| 24 | 表单分隔线/面 | Form Design | 线转面优化 |
| 25 | 层级清晰 | Typography → Hierarchy | 字号/加粗/颜色 |
| 26 | 渐变背景/元素 | Background Design | `bg-gradient-to-r` |
| 27 | 卡片排版 | Common Patterns → Cards | 可选卡片设计 |
| 28 | 文本对齐 | Layout Patterns | 左对齐优先 |
| 29 | 文本行高 | Typography → Line Height | 小字大行高 |
| 30 | 渐变蒙版 | Image Overlays | `bg-gradient-to-t` |
| 31 | 双倍间距 | Spacing → Proximity | 末元素双倍间距 |
| 32 | 双边框圆角半径 | Spacing → Border Radius | 2倍比例关系 |
| 33 | 给头像添加描边 | Avatar Design | `ring-2 ring-white` |
| 34 | 字体识别度 | Typography → Legibility | 避免混淆字母 |
| 35 | 善用图标 | Icon Guidelines | 图标+文本组合 |

---

## Glassmorphism Implementation

### Core Glass Classes
- Use `bg-glass/30` for semi-transparent backgrounds
- Apply `backdrop-blur-xl` for blur effect
- Use `border border-glass-border` for subtle borders
- Add `text-white` for text contrast on glass backgrounds

### Glass Card Pattern
```tsx
<div className="bg-glass/30 backdrop-blur-xl border border-glass-border rounded-lg">
  <div className="text-white">
    Content
  </div>
</div>
```

### Light Mode Considerations
- Glass cards in light mode: Use `bg-white/80` or higher opacity
- Text contrast in light mode: Use `#0F172A` (slate-900) for primary text
- Muted text in light mode: Use `#475569` (slate-600) minimum
- Border visibility in light mode: Use `border-gray-200`

## Color Palette

### Primary Tech Colors
- `tech-darkblue`: `#0f172a` - Primary dark background
- `tech-deepblue`: `#1e3a8a` - Secondary dark background

### Cyan Accents
- `tech-cyan`: `#06b6d4` - Primary accent
- `tech-lightcyan`: `#22d3ee` - Secondary accent
- `tech-sky`: `#0ea5e9` - Tertiary accent

### Glass Colors
- `glass`: `rgba(15, 23, 42, 0.5)` - Default glass background
- `glass-light`: Lighter glass variant for overlays
- `glass-border`: Subtle border color for glass elements
- `glass-glow`: Glow effect color for interactive elements

### 60-30-10 Color Rule (配色黄金比例)
遵循色彩平衡的最佳比例原则：

```tsx
// 60% 主色调 - 页面背景、主要表面
<div className="bg-tech-darkblue min-h-screen">  {/* 60% */}
  
  {/* 30% 辅助色 - 卡片、区块 */}
  <div className="bg-tech-deepblue/50">  {/* 30% */}
    
    {/* 10% 点缀色 - 按钮、高亮、交互元素 */}
    <button className="bg-tech-cyan text-white">  {/* 10% */}
      Action
    </button>
  </div>
</div>
```

**应用原则：**
- **60%** 主色调: `bg-tech-darkblue` - 页面背景、导航栏、主要表面
- **30%** 辅助色: `bg-tech-deepblue` / `bg-glass/30` - 卡片、侧边栏、区块背景
- **10%** 点缀色: `text-tech-cyan` / `bg-tech-cyan` - 按钮、链接、高亮、图标

**常见错误：**
```tsx
// ❌ 错误：点缀色使用过多
<div className="bg-tech-cyan p-4">  {/* 点缀色占60% */}
  <button className="bg-tech-lightcyan">...</button>
</div>

// ✅ 正确：点缀色仅用于关键元素
<div className="bg-tech-darkblue p-4">  {/* 主色调 */}
  <button className="bg-tech-cyan">...</button>  {/* 点缀色仅10% */}
</div>
```

### Color Usage Rules
- Avoid generic color schemes (blue/white/gray)
- Stick to defined palette for consistency
- Use tech colors for branding elements
- Use cyan accents for interactive elements and highlights
- Maintain WCAG AA contrast ratios (4.5:1 minimum)

## Typography

### Font Stack
- Primary: Inter (configured in `layout.tsx`)
- Fallback: System fonts for performance

### Typography Scale
Use Tailwind's default scale:
- `text-xs` - Small labels (12px)
- `text-sm` - Body text (14px)
- `text-base` - Default (16px)
- `text-lg` - Large text (18px)
- `text-xl` - Headings (20px)
- `text-2xl` - Section headings (24px)
- `text-3xl` - Page headings (30px)
- `text-4xl` - Hero headings (36px)

### Typography Guidelines
- Maintain good contrast ratios for accessibility
- Use appropriate font weights (font-light, font-normal, font-semibold, font-bold)
- Avoid generic fonts for headings when custom alternatives available
- Use semantic HTML (`h1`-`h6`, `p`, `span`, etc.)

### Optical Alignment (视觉对齐)
根据米勒-莱尔错觉原理，某些字母需要视觉对齐补偿而非机械对齐：

**需要特别注意的字母：** A, C, O, Q, S, T, C, W

```tsx
// ❌ 机械对齐 - 看起来偏左
<h1 className="text-4xl font-bold">COOL Design</h1>

// ✅ 视觉对齐 - 微调左边距
<h1 className="text-4xl font-bold ml-[2px]">COOL Design</h1>
// 或使用内部padding
<h1 className="text-4xl font-bold pl-1">COOL Design</h1>
```

**对齐规则：**
- 标题文字适当右移 1-2px (`ml-[1px]` 或 `ml-[2px]`)
- 使用视觉中心对齐，而非几何边缘对齐
- 大写字母组合时注意整体视觉平衡

### Font Legibility (字体识别度)
避免使用容易混淆字母的字体：

**易混淆字符对：**
- **i / l / I** (小写i、小写L、大写i)
- **0 / O** (数字0、大写O)
- **rn / m** (r+n 连看起来像 m)

```tsx
// ❌ Arial - i和L容易混淆
<span className="font-sans">Illustration</span>

// ✅ Verdana / Inter - 更好的识别度
<span className="font-[Verdana]">Illustration</span>
// 或项目默认的 Inter
<span className="font-sans tracking-wide">Illustration</span>
```

**建议：**
- 正文优先使用 Inter 或 Verdana
- 小字号时增加字间距 (`tracking-wide`)
- 避免使用 ultra-thin 字重 (font-thin) 用于小字

### Line Height Rules (文本行高)
遵循"文本越小，行高越大"的原则：

| 字体大小 | 行高规则 | Tailwind类 | 适用场景 |
|----------|----------|------------|----------|
| `text-xs` (12px) | 大行高 1.5-1.6 | `leading-5` 或 `leading-6` | 标签、辅助文字 |
| `text-sm` (14px) | 中大行高 1.4-1.5 | `leading-5` 或 `leading-relaxed` | 正文、描述 |
| `text-base` (16px) | 适中行高 1.5 | `leading-7` 或 `leading-normal` | 默认正文 |
| `text-lg` (18px) | 标准行高 1.4 | `leading-7` 或 `leading-snug` | 大段正文 |
| `text-xl` (20px) | 紧凑行高 1.2-1.3 | `leading-6` 或 `leading-tight` | 小标题 |
| `text-2xl+` (24px+) | 很紧凑 1.1-1.2 | `leading-tight` 或 `leading-none` | 大标题 |

```tsx
// ✅ 小字大行高 - 易读
<p className="text-xs leading-5 text-muted-foreground">
  辅助说明文字，需要更大的行高来提升可读性
</p>

// ✅ 大字小行高 - 紧凑有力
<h1 className="text-4xl leading-tight font-bold">
  主标题
</h1>

// ❌ 小字小行高 - 拥挤难读
<p className="text-xs leading-3">...</p>

// ❌ 大字大行高 - 松散无力
<h1 className="text-4xl leading-loose">...</h1>
```

### English Font Separation (英文数字别用中文字体)
中英文/数字混排时，使用各自的字体：

```tsx
// tailwind.config.ts 配置
fontFamily: {
  sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
  chinese: ['PingFang SC', 'Microsoft YaHei', 'sans-serif'],
  number: ['Inter', 'SF Pro Display', 'Roboto', 'sans-serif'],
}

// 使用示例
<p className="font-sans">
  中文内容
  <span className="font-[Inter]">English Text</span>
  和数字
  <span className="font-[Inter] tabular-nums">1,234</span>
</p>
```

**规则：**
- 中文使用：PingFang SC、Microsoft YaHei、思源黑体
- 英文/数字使用：Inter、Roboto、SF Pro
- 数字使用 `tabular-nums` 保持等宽对齐

## Motion & Animation

### Available Animations
Predefined keyframes in `tailwind.config.js`:

| Animation | Duration | Usage |
|-----------|----------|-------|
| `fade-in-up` | 0.6s | Content appearing from bottom |
| `slide-in-left` | 0.6s | Elements entering from left |
| `slide-in-right` | 0.6s | Elements entering from right |
| `scale-fade-in` | 0.5s | Smooth entry effects |
| `fade-scale-up` | 0.6s | Combined fade and scale |
| `fade-in` | 0.6s | Simple fade effect |
| `glass-float` | 6s | Subtle floating effect on glass cards |
| `float-improved` | 8s | Enhanced floating animation |
| `pulse-glow` | 2s | Important elements |
| `glow-pulse` | 3s | Enhanced glow effect |
| `ripple` | 0.6s | Interactive feedback |
| `gradient-move` | 8s | Animated gradient backgrounds |
| `vertical-scroll` | 20s | Continuous vertical motion |

### Animation Usage Rules
- Apply `animate-fade-in-up` for entrance animations
- Use `animate-slide-in-left` for side elements
- Apply `animate-glass-float` for floating glass cards
- Use `animate-pulse-glow` for important interactive elements
- Apply animation delays with `delay-100`, `delay-200`, `delay-300` for staggered effects
- Avoid excessive animations that distract from content
- Respect `prefers-reduced-motion` for accessibility

### Animation Delays
- `delay-50`: 50ms
- `delay-100`: 100ms
- `delay-150`: 150ms
- `delay-200`: 200ms
- `delay-250`: 250ms
- `delay-300`: 300ms
- `delay-400`: 400ms
- `delay-500`: 500ms

## Spacing & Composition

### Spacing Scale
Follow Tailwind's spacing scale:
- `p-4`, `px-4`, `py-4` - Base padding (16px)
- `p-6`, `px-6`, `py-6` - Medium padding (24px)
- `p-8`, `px-8`, `py-8` - Large padding (32px)
- `gap-4`, `gap-x-4`, `gap-y-4` - Base gap (16px)
- `gap-6`, `gap-x-6`, `gap-y-6` - Medium gap (24px)
- `gap-8`, `gap-x-8`, `gap-y-8` - Large gap (32px)

### Layout Patterns
- Use flexbox for one-dimensional layouts: `flex`, `justify-center`, `items-center`
- Use grid for two-dimensional layouts: `grid`, `grid-cols-1`, `md:grid-cols-2`, `lg:grid-cols-3`
- Maintain visual hierarchy with appropriate sizing
- Use glass cards for content containers
- Balance transparency and opacity for visual clarity
- Implement consistent gutter spacing with `gap-x-*` and `gap-y-*`

### Divider Guidelines (减少线的使用)
优先使用间距而非分割线来区分内容：

```tsx
// ❌ 错误：瀑布流使用分割线
<div className="divide-y divide-gray-200">
  <Item />
  <Item />
  <Item />
</div>

// ✅ 正确：用间距替代分割线
<div className="space-y-6">
  <Item />
  <Item />
  <Item />
</div>

// ✅ 或用 gap
<div className="flex flex-col gap-6">
  <Item />
  <Item />
</div>
```

**使用分割线的例外情况：**
- 表单中的明确分区
- 侧边栏导航分组
- 必须使用线时：`border-gray-200/30` 极浅颜色

### Border Radius Scaling (双边框圆角半径)
大元素使用2倍于小元素的圆角半径，保持视觉层级：

| 元素类型 | 圆角大小 | Tailwind类 |
|----------|----------|------------|
| 小元素 (按钮、标签) | 8px | `rounded-lg` |
| 中元素 (输入框、小卡片) | 12px | `rounded-xl` |
| 大元素 (卡片、容器) | 16-24px | `rounded-2xl` |
| 头像 | 18px | `rounded-[18px]` |
| 大卡片 | 36px | `rounded-[36px]` |

```tsx
// ✅ 2倍比例关系
<div className="rounded-[36px] p-6">  {/* 大卡片 */}
  <img className="rounded-[18px] w-16 h-16" />  {/* 头像 - 正好一半 */}
</div>

// ❌ 比例不协调
<div className="rounded-lg">  {/* 小圆角 */}
  <img className="rounded-full" />  {/* 突然变成圆形 */}
</div>
```

### Double Spacing (双倍间距)
对末元素或特殊元素使用双倍间距，创造视觉呼吸感：

```tsx
// 普通间距
<div className="flex flex-col gap-4">
  <Item />
  <Item />
  <Item />
</div>

// 最后一个元素双倍间距
<div className="flex flex-col gap-4">
  <Item />
  <Item />
  <div className="mt-8">  {/* 双倍间距 */}
    <SubmitButton />
  </div>
</div>

// 或直接在容器上设置
<div className="flex flex-col gap-4 [&>*:last-child]:mt-8">
  <Item />
  <Item />
  <LastItem />
</div>
```

**应用场景：**
- 表单最后一个提交按钮
- 卡片列表末尾的"加载更多"
- 底部操作栏与内容的分离

### Proximity-Based Spacing (亲密性间距)
根据元素关系调整间距：

```tsx
// 相关元素：小间距
<div className="flex items-center gap-2">  {/* 8px */}
  <Label />
  <Value />
</div>

// 无关元素：大间距
<div className="flex flex-col gap-8">  {/* 32px */}
  <SectionA />
  <SectionB />
</div>

// 混合使用
<div className="flex flex-col gap-8">
  <section className="flex flex-col gap-4">
    {/* 小节内部紧密 */}
  </section>
  <section className="flex flex-col gap-4">
    {/* 不同节之间宽松 */}
  </section>
</div>
```

**规则：**
- 相关元素：`gap-2` (8px) 或 `gap-3` (12px)
- 同组元素：`gap-4` (16px)
- 不同组元素：`gap-6` (24px) 或 `gap-8` (32px)

### Responsive Breakpoints
- `xs`: 475px - Extra small devices
- `sm`: 640px - Small tablets
- `md`: 768px - Tablets
- `tab`: 834px - iPad portrait
- `lg`: 1024px - Small laptops
- `xl`: 1280px - Laptops
- `2xl`: 1536px - Large screens

## Anti-Patterns to Avoid

### Visual Anti-Patterns
- Generic font stacks (avoid default Inter/Roboto without customization)
- Clichéd color schemes (avoid common palettes like blue/white/gray)
- Predictable layouts (avoid standard card grids without glass treatment)
- Heavy solid backgrounds (avoid when glassmorphism is appropriate)
- Static content without subtle motion (use animations sparingly but effectively)

### Interaction Anti-Patterns
- No visual feedback on hover
- Excessive animations that distract
- Inconsistent hover effects
- Missing cursor states on interactive elements
- Layout shifts on hover

### Accessibility Anti-Patterns
- Insufficient color contrast
- Missing alt text on images
- No focus indicators
- Inaccessible to keyboard navigation
- No `prefers-reduced-motion` support

## Icon Guidelines

### Icon Usage
- Use SVG icons (Heroicons, Lucide, Simple Icons)
- Never use emojis as UI icons (🎨, 🚀, ⚙️)
- Use consistent icon sizing (24x24 viewBox with w-6 h-6)
- Verify brand logos from Simple Icons

### Icon Styling
- Apply `text-white` or `text-tech-cyan` for visibility
- Use `w-6 h-6` for standard icon size
- Apply hover effects with `transition-colors duration-200`
- Use proper ARIA labels for accessibility

## Extended UI Patterns (35条规则扩展)

### Empty State Design (空状态设计)
无数据、无网络、错误状态使用情感化插画替代简单文字：

```tsx
// ❌ 简单文字
<div>暂无数据</div>

// ✅ 完整空状态组件
<div className="flex flex-col items-center justify-center py-16 text-center">
  <EmptyStateIllustration className="w-48 h-48 mb-6" />
  <h3 className="text-lg font-semibold text-white mb-2">
    暂无数据
  </h3>
  <p className="text-sm text-white/60 mb-6 max-w-xs">
    当前列表为空，点击下方按钮添加第一条记录
  </p>
  <Button className="bg-tech-cyan text-white">
    <PlusIcon className="w-4 h-4 mr-2" />
    立即添加
  </Button>
</div>
```

**空状态三要素：**
1. **插画** - 情感化图标或插图
2. **说明** - 解释当前状态
3. **操作** - 引导用户下一步

**常见场景：**
- 无网络连接
- 搜索无结果
- 列表为空
- 404/500错误页面

### Squircle Pattern (椭圆矩形/超椭圆)
APP金刚区或主要功能入口使用超椭圆形状，比圆角矩形更圆润，比圆形更方正：

```tsx
// 超椭圆实现 (iOS风格)
<div className="rounded-[22%] bg-gradient-to-br from-tech-cyan to-tech-sky p-6">
  <HomeIcon className="w-8 h-8 text-white" />
</div>

// 或更圆的超椭圆
<div className="rounded-[30%] bg-tech-deepblue p-4">
  <Icon />
</div>

// tailwind.config.ts 中自定义
borderRadius: {
  'squircle': '22%',
  'squircle-lg': '30%',
}
```

**使用场景：**
- APP金刚区图标
- 快捷入口按钮
- 用户头像容器

### Overlapping Elements (图片元素重叠)
个人资料卡片等场景添加重叠元素，增加设计深度：

```tsx
// 头像与卡片重叠
<div className="relative bg-glass/30 rounded-2xl p-6 pt-12">
  {/* 头像向上偏移，与卡片重叠 */}
  <div className="absolute -top-8 left-6">
    <div className="relative">
      <img 
        src="avatar.jpg" 
        className="w-16 h-16 rounded-full ring-4 ring-tech-darkblue"
      />
      {/* 状态指示器也重叠 */}
      <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full ring-2 ring-tech-darkblue" />
    </div>
  </div>
  
  <div className="mt-4">
    <h3 className="text-white font-semibold">用户名</h3>
    <p className="text-white/60 text-sm">描述信息</p>
  </div>
</div>
```

**重叠技巧：**
- 使用负边距 ` -mt-8` 或绝对定位
- 添加描边/边框区分层级
- 阴影增强立体感

### Avatar Design (给头像添加描边)
复杂背景上的头像添加白色/亮色描边，避免融入背景：

```tsx
// 基础描边
<img className="w-12 h-12 rounded-full ring-2 ring-white" />

// 与背景融合的描边
<img className="w-12 h-12 rounded-full ring-2 ring-tech-darkblue" />

// 多重描边
<div className="relative">
  <img className="w-12 h-12 rounded-full ring-2 ring-white" />
  <div className="absolute inset-0 rounded-full ring-2 ring-tech-cyan/30 ring-offset-2 ring-offset-tech-darkblue" />
</div>

// 在线状态组合
<div className="relative inline-block">
  <img className="w-12 h-12 rounded-full ring-2 ring-white" />
  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
</div>
```

### Image Overlay & Gradient Mask (渐变蒙版)
文本覆盖在图片上时，添加渐变蒙版提升可读性：

```tsx
// 底部渐变蒙版
<div className="relative">
  <img src="hero.jpg" className="w-full h-64 object-cover" />
  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
  <div className="absolute bottom-4 left-4 right-4">
    <h2 className="text-white text-xl font-bold">标题文字</h2>
    <p className="text-white/80 text-sm">描述文字</p>
  </div>
</div>

// 全图蒙版
<div className="relative">
  <img src="bg.jpg" className="w-full h-48 object-cover" />
  <div className="absolute inset-0 bg-tech-darkblue/60" />
  <div className="absolute inset-0 flex items-center justify-center">
    <span className="text-white font-semibold">居中文本</span>
  </div>
</div>
```

### Background Elements (添加背景元素)
纯色背景单调时，添加几何形状或渐变增加高级感：

```tsx
// 渐变背景
<div className="relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-tech-darkblue via-tech-deepblue to-tech-darkblue" />
  <div className="absolute top-0 right-0 w-96 h-96 bg-tech-cyan/10 rounded-full blur-3xl" />
  <div className="absolute bottom-0 left-0 w-64 h-64 bg-tech-sky/10 rounded-full blur-3xl" />
  
  <div className="relative z-10">
    {/* 内容 */}
  </div>
</div>

// 几何形状装饰
<div className="relative overflow-hidden bg-tech-darkblue">
  {/* 网格背景 */}
  <div className="absolute inset-0 opacity-10" 
       style={{ 
         backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
         backgroundSize: '50px 50px'
       }} 
  />
  
  {/* 斜线装饰 */}
  <div className="absolute -top-20 -right-20 w-96 h-96 border-[40px] border-tech-cyan/5 rounded-full rotate-45" />
</div>
```

### Form Design (表单分隔线/面)
表单分隔线调整为面，页面更简洁舒适：

```tsx
// ❌ 使用分割线
<div className="space-y-4 divide-y divide-gray-200">
  <FormField />
  <FormField />
  <FormField />
</div>

// ✅ 使用面的背景色区分
<div className="space-y-0">
  <div className="bg-white/5 p-4 rounded-t-lg">
    <FormField />
  </div>
  <div className="bg-white/5 p-4">
    <FormField />
  </div>
  <div className="bg-white/5 p-4 rounded-b-lg">
    <FormField />
  </div>
</div>

// ✅ 或使用卡片包裹
<div className="space-y-4">
  <div className="bg-glass/20 backdrop-blur-sm border border-glass-border rounded-lg p-4">
    <FormField />
  </div>
  <div className="bg-glass/20 backdrop-blur-sm border border-glass-border rounded-lg p-4">
    <FormField />
  </div>
</div>
```

### Selection Controls (使用单选按钮)
选项少于5个用单选按钮，大于7个用下拉菜单：

```tsx
// ✅ 少于5个选项 - 使用单选按钮/卡片
<div className="flex flex-col gap-2">
  {options.map(option => (
    <label 
      key={option.value}
      className={cn(
        "flex items-center p-3 rounded-lg border cursor-pointer transition-colors",
        selected === option.value 
          ? "border-tech-cyan bg-tech-cyan/10" 
          : "border-glass-border bg-transparent"
      )}
    >
      <input 
        type="radio" 
        value={option.value}
        checked={selected === option.value}
        onChange={() => setSelected(option.value)}
        className="sr-only"
      />
      <span className={cn(
        "w-4 h-4 rounded-full border mr-3 flex items-center justify-center",
        selected === option.value 
          ? "border-tech-cyan" 
          : "border-white/40"
      )}>
        {selected === option.value && (
          <span className="w-2 h-2 rounded-full bg-tech-cyan" />
        )}
      </span>
      <span className="text-white">{option.label}</span>
    </label>
  ))}
</div>

// ✅ 大于7个选项 - 使用下拉菜单
<Select>
  <SelectTrigger className="bg-glass/30 border-glass-border">
    <SelectValue placeholder="选择选项" />
  </SelectTrigger>
  <SelectContent>
    {manyOptions.map(option => (
      <SelectItem key={option.value} value={option.value}>
        {option.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Card Patterns (使用卡片获得创意)
定价计划等场景使用可选卡片帮助用户决策：

```tsx
// 定价卡片 - 推荐选项突出
<div className="grid grid-cols-3 gap-4">
  {plans.map((plan, index) => (
    <div 
      key={plan.name}
      className={cn(
        "relative rounded-2xl p-6",
        plan.recommended 
          ? "bg-tech-cyan/20 border-2 border-tech-cyan scale-105" 
          : "bg-glass/30 border border-glass-border"
      )}
    >
      {plan.recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-tech-cyan text-white text-xs px-3 py-1 rounded-full">
          推荐
        </span>
      )}
      
      <h3 className="text-white text-lg font-semibold mb-2">{plan.name}</h3>
      <div className="text-3xl font-bold text-white mb-4">
        ¥{plan.price}
        <span className="text-sm font-normal text-white/60">/月</span>
      </div>
      
      <ul className="space-y-2 mb-6">
        {plan.features.map(feature => (
          <li key={feature} className="flex items-center text-white/80 text-sm">
            <CheckIcon className="w-4 h-4 text-tech-cyan mr-2" />
            {feature}
          </li>
        ))}
      </ul>
      
      <Button 
        className={cn(
          "w-full",
          plan.recommended 
            ? "bg-tech-cyan text-white" 
            : "bg-white/10 text-white"
        )}
      >
        选择方案
      </Button>
    </div>
  ))}
</div>
```

### Data Visualization (善用图表)
数字或百分比信息用图表展示，可视化效果更好：

```tsx
// 进度条
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span className="text-white/60">进度</span>
    <span className="text-tech-cyan">75%</span>
  </div>
  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
    <div className="h-full w-[75%] bg-gradient-to-r from-tech-cyan to-tech-sky rounded-full" />
  </div>
</div>

// 环形图/仪表盘
<div className="relative w-32 h-32">
  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
    <path
      className="text-white/10"
      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    />
    <path
      className="text-tech-cyan"
      strokeDasharray="75, 100"
      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    />
  </svg>
  <div className="absolute inset-0 flex items-center justify-center">
    <span className="text-xl font-bold text-white">75%</span>
  </div>
</div>
```

## Common UI Patterns

### Floating Navbar
```tsx
<nav className="fixed top-4 left-4 right-4 z-50 bg-glass/30 backdrop-blur-xl border border-glass-border rounded-lg">
  <div className="text-white">
    Content
  </div>
</nav>
```

### Glass Card with Hover
```tsx
<div className="bg-glass/30 backdrop-blur-xl border border-glass-border rounded-lg hover:-translate-y-1 transition-transform duration-200 cursor-pointer">
  <div className="text-white">
    Content
  </div>
</div>
```

### Hero Section with Gradient
```tsx
<section className="relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-r from-tech-darkblue via-tech-deepblue to-tech-darkblue animate-gradient-move"></div>
  <div className="relative z-10">
    <div className="text-white animate-fade-in-up">
      Hero Content
    </div>
  </div>
</section>
```

### Button with Glow
```tsx
<button className="bg-tech-cyan text-white px-6 py-3 rounded-lg hover:bg-tech-lightcyan transition-colors duration-200 animate-pulse-glow cursor-pointer">
  Button Text
</button>
```

## UI Optimization Best Practices

### Spacing & Layout Rules

#### 8-Point Grid System
- Base unit: 8px (use `p-2`, `gap-2` = 8px in Tailwind)
- For detailed interfaces: use 4px increments (`p-1`, `gap-1`)
- Spacing should increase proportionally with element size

#### Proximity-Based Spacing
```tsx
// Related elements: smaller gap
<div className="flex gap-2">
  <span>Label:</span>
  <span>Value</span>
</div>

// Unrelated groups: larger gap
<div className="flex flex-col gap-6">
  <SectionA />
  <SectionB />
</div>
```

#### Alignment Consistency
- Use single alignment method per section (prefer left-align)
- Avoid mixing left/center/right alignment in same container
- Tabs should align with content below them

#### Container vs Spacing for Grouping
- Prefer spacing (`gap-*`) over containers for grouping
- Remove unnecessary containers when spacing suffices
- Use containers only when visual separation is essential

### Button Design Standards

#### Button Hierarchy
```tsx
// Primary button - single most important action
<button className="bg-tech-cyan text-white px-6 py-3 rounded-lg font-semibold">
  Primary Action
</button>

// Secondary button - less important actions
<button className="bg-transparent border border-tech-cyan text-tech-cyan px-6 py-3 rounded-lg">
  Secondary Action
</button>

// Tertiary button - least important
<button className="bg-transparent text-muted-foreground px-4 py-2">
  Tertiary
</button>
```

#### Button Rules
- **Only ONE primary button per screen** - multiple primary buttons compete for attention
- Minimum click area: `48px × 48px` (min-h-12 min-w-12)
- Button spacing: at least `gap-2` (8px) between buttons
- Frequent actions: make buttons larger for easier clicking

#### Button Visual Requirements
- Contrast ratio ≥ 3:1 against background
- Clear border or background to distinguish from disabled state
- Visible focus indicator for keyboard navigation

### Typography Optimization

#### Letter Spacing (Tracking)
```tsx
// Large headings: tighter tracking
<h1 className="text-4xl tracking-tight">Large Title</h1>

// Body text: normal tracking
<p className="text-base tracking-normal">Body content</p>

// Small text: slightly looser tracking
<span className="text-xs tracking-wide">Caption</span>
```

#### Font Weight Guidelines
- Use only 2 font weights: `font-normal` (400) and `font-semibold` (600)
- Headings: `font-semibold` or `font-bold`
- Body text: `font-normal`
- Avoid thin weights (`font-light`) for small text - hard to read

#### Line Height Rules
- Smaller text needs larger line height
- `text-xs`: `leading-5` or `leading-6`
- `text-base`: `leading-7` or `leading-relaxed`
- Large headings: `leading-tight` or `leading-none`

### Color & Contrast Requirements

#### WCAG AA Contrast Standards
| Element Type | Minimum Contrast |
|--------------|------------------|
| UI components (buttons, inputs) | 3:1 |
| Large text (≥18px bold or ≥24px) | 3:1 |
| Small text (<18px) | 4.5:1 |
| Icons | 3:1 |

#### Color as Indicator
- **NEVER use color alone** to convey information
- Always supplement with: icons, underlines, shapes, or text
- Selected states: combine color change with underline or fill change

```tsx
// Good: color + underline
<button className={cn(
  "px-4 py-2",
  isActive && "text-tech-cyan underline"
)}>
  Tab
</button>

// Good: color + fill style
<Icon className={cn(
  "w-5 h-5",
  isActive ? "fill-tech-cyan" : "fill-none stroke-current"
)} />
```

#### High Saturation Color Usage
- Use saturated colors sparingly for accents
- Combine with muted tones (tints/shades) to reduce eye strain
- Reserve brightest colors for most important elements

### Shadow Guidelines

#### Subtle Shadow Pattern
```tsx
// Good: subtle, realistic shadow
<div className="shadow-lg shadow-black/5">

// Avoid: heavy, dark shadows
<div className="shadow-xl shadow-black/50">
```

- Mimic real-world shadows: soft, low opacity
- Use `shadow-{size} shadow-{color}/{opacity}` pattern
- Hover can increase shadow slightly for depth feedback

### Content Visibility

#### Show Important Actions
- Don't hide critical actions in menus if space permits
- Prioritize visibility over minimalism
- Users can't interact with what they can't see

```tsx
// Good: important actions visible
<div className="flex gap-2">
  <Button>Share</Button>
  <Button>Save</Button>
  <Button>More</Button>  // Less important in menu
</div>

// Avoid: all actions hidden
<DropdownMenu>
  <Button>Actions</Button>
</DropdownMenu>
```

### Icon Best Practices

#### Icon + Text Balance
- Pair icons with text labels for clarity
- Balance visual weight between icon and text
- Selected icons: use filled variant vs outlined

```tsx
// Good: balanced icon + text
<button className="flex items-center gap-2">
  <Icon className="w-5 h-5" />
  <span className="font-medium">Action</span>
</button>

// Icon-only: requires aria-label
<button aria-label="Settings">
  <SettingsIcon className="w-5 h-5" />
</button>
```

#### Icon Consistency
- Same icon family throughout (Lucide recommended)
- Consistent sizing: `w-5 h-5` (20px) or `w-6 h-6` (24px)
- Consistent stroke width: `stroke-[1.5]` or `stroke-2`

### Accessibility Standards

#### Contrast Requirements
- All text must meet WCAG AA standards (4.5:1 for small text)
- Interactive elements must have visible focus states
- Never rely solely on color to convey meaning

#### Screen Reader Support
- All images need descriptive `alt` text
- Icons without text need `aria-label`
- Form inputs need associated `<label>` elements

#### Motion Sensitivity
- Respect `prefers-reduced-motion` media query
- Provide static alternatives for animations
- Avoid flashing or rapid movement

```tsx
// Respect reduced motion preference
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
/>
```

### Design Consistency Rules

#### Visual Language Unity
- Same border radius across similar elements (buttons, cards, images)
- Consistent shadow style throughout
- Unified color palette application

#### Element Differentiation
- Buttons should look distinct from notifications
- Active/inactive states must be clearly different
- Interactive vs static elements should be obvious

### Minimalism vs Simplicity

- **Minimalism**: Fewer visual elements (can reduce usability)
- **Simplicity**: Clear, easy to understand (goal)
- Don't sacrifice usability for aesthetics
- Hidden features = non-existent features

---

## Pre-Delivery Checklist

### Visual Quality
- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] Brand logos are correct (verified from Simple Icons)
- [ ] Hover states don't cause layout shift
- [ ] Use theme colors directly (bg-primary) not var() wrapper
- [ ] Large headings use `tracking-tight`
- [ ] Only 2 font weights used (normal + semibold/bold)

### Interaction
- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide clear visual feedback
- [ ] Transitions are smooth (150-300ms)
- [ ] Focus states visible for keyboard navigation
- [ ] Button click areas ≥ 48px × 48px
- [ ] Only ONE primary button per screen

### Light/Dark Mode
- [ ] Light mode text has sufficient contrast (4.5:1 minimum)
- [ ] Glass/transparent elements visible in light mode
- [ ] Borders visible in both modes
- [ ] Test both modes before delivery

### Layout
- [ ] Floating elements have proper spacing from edges
- [ ] No content hidden behind fixed navbars
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] Single alignment method per section
- [ ] Related elements grouped with proper spacing

### Accessibility
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color is not the only indicator (supplement with icons/underlines)
- [ ] `prefers-reduced-motion` respected
- [ ] Text contrast ≥ 4.5:1 (small) or ≥ 3:1 (large)
- [ ] UI element contrast ≥ 3:1
- [ ] Icons paired with text labels or have aria-label

### Spacing
- [ ] Using 8-point grid system
- [ ] Related elements have smaller gaps
- [ ] Unrelated groups have larger gaps
- [ ] Unnecessary containers removed

### 35 UI Optimization Rules (35条UI优化规则检查)

#### Color & Visual (色彩与视觉)
- [ ] **配色黄金比例**: 检查 60%-30%-10% 色彩分布是否合理
- [ ] **阴影颜色**: 阴影不是纯黑色，使用 `shadow-black/5` 或带色调的阴影
- [ ] **渐变使用**: 背景单调时是否添加了渐变或几何形状
- [ ] **渐变蒙版**: 图片上的文字是否添加了渐变蒙版提升可读性
- [ ] **毛玻璃效果**: 需要时使用 `bg-glass/30 backdrop-blur-xl`
- [ ] **颜色区分层级**: 按钮层级是否清晰区分 (Primary/Secondary/Tertiary)

#### Typography & Alignment (排版与对齐)
- [ ] **视觉对齐**: 标题字母 A,C,O,Q,S,T,W 是否有视觉对齐微调
- [ ] **字体识别度**: 避免使用易混淆字母的字体 (i/l, 0/O)
- [ ] **行高规则**: 小字大行高 (`text-xs` → `leading-5`)，大字小行高 (`text-4xl` → `leading-tight`)
- [ ] **字体分离**: 中英文/数字是否使用了各自的字体
- [ ] **层级清晰**: 通过字号/字重/颜色区分信息层级
- [ ] **文本对齐**: 同一区块使用统一对齐方式 (优先左对齐)

#### Spacing & Layout (间距与布局)
- [ ] **减少分割线**: 优先使用间距 (`gap-6`) 而非分割线 (`border-b`)
- [ ] **双边框圆角**: 大元素使用2倍于小元素的圆角 (`18px` → `36px`)
- [ ] **双倍间距**: 末元素或特殊元素使用双倍间距 (`gap-4` → `mt-8`)
- [ ] **亲密性间距**: 相关元素小间距，无关元素大间距
- [ ] **卡片间距**: 文案多的卡片有足够的留白和呼吸空间

#### Components (组件)
- [ ] **单选按钮**: 选项少于5个使用单选按钮，大于7个使用下拉菜单
- [ ] **空状态**: 无数据/错误状态使用插画+文字+操作，而非简单文字
- [ ] **头像描边**: 复杂背景上的头像有白色/亮色描边
- [ ] **元素重叠**: 个人资料卡片等使用重叠元素增加深度
- [ ] **超椭圆**: APP金刚区使用超椭圆形状 (`rounded-[22%]`)

#### Content (内容)
- [ ] **重要信息可见**: 关键操作没有隐藏在菜单中 (空间允许时)
- [ ] **图表展示**: 数字/百分比信息优先使用图表可视化
- [ ] **表单优化**: 表单分隔使用"面"替代"线"
- [ ] **按钮标签**: 不仅依赖图标，重要按钮使用文本标签
- [ ] **文字识别度**: 复杂图片上的文字有底色背景

#### Button & Icon (按钮与图标)
- [ ] **按钮优先级**: 每屏只有一个主按钮 (Primary)
- [ ] **图标一致性**: 同一图标集，统一尺寸 (`w-6 h-6`)
- [ ] **图标+文本**: 图标配合文本标签，或添加 `aria-label`
- [ ] **卡片选择**: 定价计划等使用可选卡片帮助用户决策
