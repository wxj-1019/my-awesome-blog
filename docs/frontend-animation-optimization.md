# 首页苹果风格动画优化技术文档

> 版本: 1.0.0  
> 更新日期: 2026-03-22  
> 作者: AI Assistant

## 目录

1. [设计原则](#1-设计原则)
2. [动画规范](#2-动画规范)
3. [组件优化方案](#3-组件优化方案)
4. [代码实现](#4-代码实现)
5. [实施步骤](#5-实施步骤)
6. [测试验证](#6-测试验证)

---

## 1. 设计原则

### 1.1 苹果设计语言核心

| 原则 | 描述 | 实现要点 |
|------|------|----------|
| **流畅性** | 动画应该感觉自然流畅，无卡顿 | 使用苹果标准缓动曲线 |
| **微妙性** | 动画不应过于夸张，保持克制 | 避免过大的位移和缩放 |
| **一致性** | 所有动画遵循统一的节奏和风格 | 统一时长和缓动函数 |
| **目的性** | 每个动画都有明确的交互反馈目的 | 不添加无意义的装饰动画 |
| **高性能** | 动画不应影响页面性能和响应速度 | 优先使用 CSS 动画和 transform |

### 1.2 与现有科技风格的融合

- 保留 Glassmorphism 毛玻璃效果
- 保留 tech-cyan 强调色
- 移除过度科技感的发光、粒子、彩虹效果
- 采用更柔和的阴影和过渡

---

## 2. 动画规范

### 2.1 标准缓动曲线

```css
/* 苹果标准缓动曲线 */
:root {
  /* 标准 ease - 最常用的曲线 */
  --apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
  
  /* 减速曲线 - 元素进入时使用 */
  --apple-decelerate: cubic-bezier(0, 0, 0.2, 1);
  
  /* 加速曲线 - 元素离开时使用 */
  --apple-accelerate: cubic-bezier(0.4, 0, 1, 1);
  
  /* 弹簧曲线 - 需要轻微回弹效果时使用 */
  --apple-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  
  /* 强调弹簧 - 更明显的弹跳效果 */
  --apple-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 2.2 标准动画时长

| 类型 | 时长 | 使用场景 | CSS 变量 |
|------|------|----------|----------|
| **快速** | 150ms | 按钮 hover、图标变化、点击反馈 | `--duration-fast` |
| **标准** | 300ms | 卡片悬浮、面板展开、tab 切换 | `--duration-normal` |
| **中等** | 400ms | 模态框、下拉菜单、侧边栏 | `--duration-medium` |
| **缓慢** | 500ms | 页面入场、大元素动画 | `--duration-slow` |
| **很慢** | 600ms | 全屏过渡、复杂动画编排 | `--duration-slower` |

```css
:root {
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-medium: 400ms;
  --duration-slow: 500ms;
  --duration-slower: 600ms;
}
```

### 2.3 阴影规范

```css
:root {
  /* 苹果风格阴影层级 */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.10);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.12);
  
  /* Hover 状态阴影增强 */
  --shadow-hover-sm: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-hover-md: 0 8px 20px rgba(0, 0, 0, 0.12);
  --shadow-hover-lg: 0 12px 32px rgba(0, 0, 0, 0.15);
  
  /* 毛玻璃卡片阴影 */
  --shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.08);
  --shadow-glass-hover: 0 12px 40px rgba(0, 0, 0, 0.12);
}
```

### 2.4 模糊规范

```css
:root {
  /* 背景模糊 */
  --blur-sm: 8px;
  --blur-md: 16px;
  --blur-lg: 24px;
  --blur-xl: 40px;
  
  /* 饱和度增强（配合模糊使用） */
  --saturate-glass: 1.8;
}
```

---

## 3. 组件优化方案

### 3.1 HeroSection 首屏区域

#### 当前问题
- 标题入场动画过于简单
- 缺少滚动指示器
- GlassCard 缺少柔和的交互反馈

#### 优化方案

| 元素 | 当前状态 | 优化后 | 实现方式 |
|------|----------|--------|----------|
| **标题文字** | `animate-fade-in-up` | 逐字优雅淡入 + 微妙位移 | Framer Motion stagger |
| **副标题** | 同上 | 延迟 100ms 后淡入 | delay + opacity |
| **GlassCard** | 静态 | 悬浮时轻微上浮 + 阴影加深 | whileHover + shadow |
| **打字机效果** | 存在闪烁 | 增加光标闪烁周期 | animation duration |
| **滚动指示** | 无 | 优雅弹跳的向下箭头 | motion.div animate |
| **视频背景** | 静态 | 轻微缩放呼吸效果 | CSS animation |

#### 动画参数

```typescript
// 标题入场动画
const titleVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
}

// 副标题延迟入场
const subtitleVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1,
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
}

// GlassCard 交互
const cardVariants = {
  initial: { y: 0 },
  hover: {
    y: -4,
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  }
}

// 滚动指示器
const scrollIndicatorVariants = {
  animate: {
    y: [0, 6, 0],
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.8,
      repeat: Infinity,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
}
```

---

### 3.2 FeaturedHighlights 特色功能区

#### 当前问题
- 卡片入场动画不够优雅
- Hover 效果过于花哨（图标旋转）
- 缺少点击反馈

#### 优化方案

| 元素 | 当前状态 | 优化后 | 实现方式 |
|------|----------|--------|----------|
| **卡片入场** | Framer Motion scale | 优雅淡入上移 | y + opacity |
| **卡片 Hover** | 图标旋转 + 边框发光 | 轻微上浮 + 阴影加深 | y + shadow |
| **图标** | 360° 旋转 | 轻微缩放 (1.05) | scale |
| **点击反馈** | 无 | 轻微缩小 (0.98) | whileTap |
| **边框** | 发光边框 | 柔和灰色边框 | border-gray-200/50 |
| **Badge** | 无动画 | 柔和呼吸效果 | opacity animation |

#### 动画参数

```typescript
// 卡片依次入场
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
}

// 图标 Hover 效果
const iconVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { duration: 0.15 }
  }
}

// Badge 呼吸效果
const badgeVariants = {
  animate: {
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}
```

---

### 3.3 StatsPanel 统计面板

#### 当前问题
- 图表是静态的
- 数字没有动画
- 指示灯脉冲过于强烈

#### 优化方案

| 元素 | 当前状态 | 优化后 | 实现方式 |
|------|----------|--------|----------|
| **数字** | 静态显示 | 平滑滚动到目标值 | useSpring |
| **图表入场** | 无动画 | 从底部优雅生长 | Recharts 动画 |
| **卡片 Hover** | 简单 scale | 轻微上浮 + 阴影 | y + shadow |
| **实时指示** | 强烈脉冲 | 柔和呼吸 | opacity 2s |
| **统计图标** | 无动画 | 悬浮时轻微缩放 | scale |

#### 动画参数

```typescript
// 数字滚动动画
import { useSpring, useTransform, motion } from 'framer-motion'

function AnimatedNumber({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const spring = useSpring(0, { 
    damping: 30, 
    stiffness: 100 
  })
  const display = useTransform(spring, (current) => Math.round(current))
  
  useEffect(() => {
    spring.set(value)
  }, [spring, value])
  
  return <motion.span>{display}</motion.span>
}

// 图表配置（Recharts）
const chartConfig = {
  animationBegin: 0,
  animationDuration: 1000,
  animationEasing: 'ease-out'
}

// 实时指示器
const liveIndicatorVariants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}
```

---

### 3.4 ProfileCard 个人卡片

#### 当前问题
- 展开动画不够流畅
- 头像缺少交互效果
- 按钮缺少点击反馈

#### 优化方案

| 元素 | 当前状态 | 优化后 | 实现方式 |
|------|----------|--------|----------|
| **入场** | CSS 过渡 | 优雅淡入缩放 | scale + opacity |
| **展开/收起** | CSS height | 平滑高度变化 | AnimatePresence |
| **头像** | 静态 | 悬浮时轻微放大 + 柔和边框 | scale + ring |
| **在线状态** | 静态 | 柔和呼吸动画 | opacity animation |
| **社交图标** | 简单 hover | 轻微上浮 + 颜色变化 | y + color |
| **按钮** | 无反馈 | 点击时缩小 | whileTap |

#### 动画参数

```typescript
// 卡片入场
const profileCardVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
}

// 展开/收起
const expandVariants = {
  collapsed: { 
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.2 }
    }
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.4 },
      opacity: { duration: 0.3, delay: 0.1 }
    }
  }
}

// 头像 Hover
const avatarVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 }
  }
}

// 在线状态指示
const onlineStatusVariants = {
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

// 按钮
const buttonVariants = {
  hover: {
    scale: 1.02,
    transition: { duration: 0.15 }
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 }
  }
}
```

---

### 3.5 FriendLinks 友链区域

#### 当前问题
- 入场动画过于简单
- Hover 效果单一
- 缺少点击反馈

#### 优化方案

| 元素 | 当前状态 | 优化后 | 实现方式 |
|------|----------|--------|----------|
| **卡片入场** | 无动画 | 依次淡入 | stagger + opacity |
| **卡片 Hover** | scale(1.05) | 轻微上浮 + 背景变亮 | y + bg-opacity |
| **点击反馈** | 无 | 轻微缩小 | whileTap |
| **图标** | 静态 | 保持清晰无特效 | - |

#### 动画参数

```typescript
// 容器 stagger
const linksContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05
    }
  }
}

// 单个卡片
const linkCardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
}

// Hover 效果
const linkHoverVariants = {
  initial: { y: 0 },
  hover: {
    y: -2,
    transition: { duration: 0.15 }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  }
}
```

---

### 3.6 WaveStack 波浪组件

#### 当前问题
- 波浪动画较机械
- 缺少自然感
- 可能有 skew 变形

#### 优化方案

| 元素 | 当前状态 | 优化后 | 实现方式 |
|------|----------|--------|----------|
| **波浪** | 复杂变形 | 柔和水平移动 | translateX |
| **颜色** | 彩虹/渐变 | 单一深色或渐变 | bg-black |
| **动画曲线** | linear | ease-in-out | 缓动函数 |
| **动画速度** | 较快 | 8-12s 周期 | duration |

#### 动画参数

```css
/* 苹果风格波浪动画 */
@keyframes apple-wave {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-20px);
  }
}

.wave-path {
  animation: apple-wave 8s ease-in-out infinite;
}

/* 不同层波浪的延迟 */
.wave-path:nth-child(1) { animation-delay: 0s; }
.wave-path:nth-child(2) { animation-delay: -2s; }
.wave-path:nth-child(3) { animation-delay: -4s; }
```

---

## 4. 代码实现

### 4.1 通用动画 Hook

创建 `frontend/src/hooks/useAppleAnimation.ts`:

```typescript
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useInView, useSpring, useTransform, motion, AnimationProps } from 'framer-motion'

// 苹果标准缓动曲线
export const APPLE_EASE = [0.25, 0.1, 0.25, 1] as const
export const APPLE_DECELERATE = [0, 0, 0.2, 1] as const
export const APPLE_SPRING = [0.175, 0.885, 0.32, 1.275] as const
export const APPLE_BOUNCE = [0.34, 1.56, 0.64, 1] as const

// 标准时长
export const DURATION = {
  fast: 0.15,
  normal: 0.3,
  medium: 0.4,
  slow: 0.5,
  slower: 0.6
} as const

// 滚动触发动画 Hook
export function useScrollReveal(options?: {
  once?: boolean
  margin?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, {
    once: options?.once ?? true,
    margin: options?.margin ?? '-100px'
  })

  const variants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      transition: {
        duration: DURATION.slow,
        ease: APPLE_EASE,
        delay: options?.delay ?? 0
      }
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: DURATION.slow,
        ease: APPLE_EASE,
        delay: options?.delay ?? 0
      }
    }
  }

  return {
    ref,
    isInView,
    variants,
    initial: 'hidden',
    animate: isInView ? 'visible' : 'hidden'
  }
}

// 数字滚动动画 Hook
export function useAnimatedNumber(targetValue: number, options?: {
  duration?: number
  damping?: number
  stiffness?: number
}) {
  const spring = useSpring(0, {
    damping: options?.damping ?? 30,
    stiffness: options?.stiffness ?? 100
  })
  const display = useTransform(spring, (current) => Math.round(current))

  useEffect(() => {
    spring.set(targetValue)
  }, [spring, targetValue])

  return { spring, display }
}

// Stagger 容器动画配置
export function getStaggerContainerConfig(itemCount: number, options?: {
  staggerDelay?: number
  initialDelay?: number
}) {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: options?.staggerDelay ?? 0.08,
        delayChildren: options?.initialDelay ?? 0.1
      }
    }
  }
}

// Stagger 子项动画配置
export function getStaggerItemConfig(options?: {
  y?: number
  duration?: number
}) {
  return {
    hidden: { 
      opacity: 0, 
      y: options?.y ?? 16 
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: options?.duration ?? DURATION.medium,
        ease: APPLE_EASE
      }
    }
  }
}

// 卡片 Hover 动画配置
export function getCardHoverConfig() {
  return {
    initial: { y: 0, scale: 1 },
    whileHover: { 
      y: -4,
      transition: { 
        duration: DURATION.fast, 
        ease: APPLE_EASE 
      }
    },
    whileTap: { 
      scale: 0.98,
      transition: { 
        duration: 0.1 
      }
    }
  }
}

// 按钮动画配置
export function getButtonAnimationConfig() {
  return {
    whileHover: { 
      scale: 1.02,
      transition: { 
        duration: DURATION.fast 
      }
    },
    whileTap: { 
      scale: 0.95,
      transition: { 
        duration: 0.1 
      }
    }
  }
}

// 呼吸动画配置（用于指示器、Badge 等）
export function getBreathingConfig(options?: {
  duration?: number
  minOpacity?: number
  maxOpacity?: number
}) {
  return {
    animate: {
      opacity: [
        options?.minOpacity ?? 0.5, 
        options?.maxOpacity ?? 1, 
        options?.minOpacity ?? 0.5
      ],
      transition: {
        duration: options?.duration ?? 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  }
}

// 导出类型
export type AppleAnimationConfig = {
  ease: typeof APPLE_EASE
  duration: typeof DURATION
}
```

### 4.2 通用动画组件

创建 `frontend/src/components/ui/AppleAnimated.tsx`:

```typescript
'use client'

import React, { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { 
  APPLE_EASE, 
  DURATION, 
  getCardHoverConfig, 
  getStaggerItemConfig 
} from '@/hooks/useAppleAnimation'

// 基础淡入上移动画组件
interface FadeUpProps extends HTMLMotionProps<'div'> {
  delay?: number
  duration?: number
  children: React.ReactNode
}

export function FadeUp({ delay = 0, duration = DURATION.slow, children, ...props }: FadeUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration,
        delay,
        ease: APPLE_EASE
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Stagger 容器组件
interface StaggerContainerProps extends HTMLMotionProps<'div'> {
  staggerDelay?: number
  initialDelay?: number
  children: React.ReactNode
}

export function StaggerContainer({ 
  staggerDelay = 0.08, 
  initialDelay = 0.1, 
  children, 
  ...props 
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: initialDelay
          }
        }
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Stagger 子项组件
interface StaggerItemProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
}

export function StaggerItem({ children, ...props }: StaggerItemProps) {
  return (
    <motion.div
      variants={getStaggerItemConfig()}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// 卡片组件（带 Hover 效果）
interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  className?: string
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className = '', ...props }, ref) => {
    const hoverConfig = getCardHoverConfig()
    
    return (
      <motion.div
        ref={ref}
        initial={hoverConfig.initial}
        whileHover={hoverConfig.whileHover}
        whileTap={hoverConfig.whileTap}
        className={`transition-shadow duration-300 ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

AnimatedCard.displayName = 'AnimatedCard'

// 滚动指示器组件
interface ScrollIndicatorProps {
  className?: string
}

export function ScrollIndicator({ className = '' }: ScrollIndicatorProps) {
  return (
    <motion.div
      animate={{
        y: [0, 6, 0],
        opacity: [0.6, 1, 0.6]
      }}
      transition={{
        duration: 1.8,
        repeat: Infinity,
        ease: APPLE_EASE
      }}
      className={`flex justify-center ${className}`}
    >
      <svg 
        className="w-6 h-6 text-gray-400" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M19 14l-7 7m0 0l-7-7m7 7V3" 
        />
      </svg>
    </motion.div>
  )
}

// 动画数字组件
interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
}

export function AnimatedNumber({ value, duration = 1.5, className = '' }: AnimatedNumberProps) {
  const nodeRef = React.useRef<HTMLSpanElement>(null)
  const [displayValue, setDisplayValue] = React.useState(0)

  React.useEffect(() => {
    const startValue = displayValue
    const startTime = performance.now()
    const endTime = startTime + duration * 1000

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)
      
      // 使用 easeOut 缓动
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = Math.round(startValue + (value - startValue) * easeOut)
      
      setDisplayValue(currentValue)

      if (currentTime < endTime) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return (
    <span ref={nodeRef} className={className}>
      {displayValue.toLocaleString()}
    </span>
  )
}

// 呼吸指示器组件
interface BreathingIndicatorProps {
  className?: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
}

export function BreathingIndicator({ 
  className = '', 
  color = 'bg-green-500',
  size = 'sm'
}: BreathingIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  return (
    <motion.span
      animate={{
        opacity: [0.5, 1, 0.5],
        scale: [1, 1.1, 1]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className={`${sizeClasses[size]} ${color} rounded-full ${className}`}
    />
  )
}
```

### 4.3 Tailwind 配置更新

在 `tailwind.config.js` 中添加苹果风格动画：

```javascript
// 在 keyframes 中添加
keyframes: {
  // ... 现有动画
  
  // 苹果风格动画
  'apple-fade-up': {
    '0%': { opacity: '0', transform: 'translateY(20px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  'apple-bounce': {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(6px)' },
  },
  'apple-breathing': {
    '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
    '50%': { opacity: '1', transform: 'scale(1.1)' },
  },
  'apple-wave': {
    '0%, 100%': { transform: 'translateX(0)' },
    '50%': { transform: 'translateX(-20px)' },
  },
},

// 在 animation 中添加
animation: {
  // ... 现有动画
  
  // 苹果风格动画
  'apple-fade-up': 'apple-fade-up 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
  'apple-bounce': 'apple-bounce 1.8s cubic-bezier(0.25, 0.1, 0.25, 1) infinite',
  'apple-breathing': 'apple-breathing 2s ease-in-out infinite',
  'apple-wave': 'apple-wave 8s ease-in-out infinite',
},

// 添加苹果风格阴影
boxShadow: {
  // ... 现有阴影
  
  // 苹果风格阴影
  'apple-sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
  'apple-md': '0 4px 12px rgba(0, 0, 0, 0.08)',
  'apple-lg': '0 8px 24px rgba(0, 0, 0, 0.10)',
  'apple-xl': '0 16px 48px rgba(0, 0, 0, 0.12)',
  'apple-hover': '0 8px 20px rgba(0, 0, 0, 0.12)',
},

// 添加苹果风格过渡时长
transitionDuration: {
  // ... 现有时长
  '150': '150ms',
  '300': '300ms',
  '400': '400ms',
  '500': '500ms',
  '600': '600ms',
},

// 添加苹果风格缓动函数
transitionTimingFunction: {
  // ... 现有缓动
  'apple-ease': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  'apple-decelerate': 'cubic-bezier(0, 0, 0.2, 1)',
  'apple-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  'apple-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
},
```

---

## 5. 实施步骤

### 5.1 第一阶段：基础设施（预计 1-2 小时）

| 步骤 | 任务 | 文件 |
|------|------|------|
| 1 | 创建通用动画 Hook | `hooks/useAppleAnimation.ts` |
| 2 | 创建通用动画组件 | `components/ui/AppleAnimated.tsx` |
| 3 | 更新 Tailwind 配置 | `tailwind.config.js` |
| 4 | 更新全局 CSS 变量 | `app/globals.css` |

### 5.2 第二阶段：HeroSection（预计 2-3 小时）

| 步骤 | 任务 | 文件 |
|------|------|------|
| 1 | 优化标题入场动画 | `components/home/HeroSection.tsx` |
| 2 | 添加滚动指示器 | `components/home/HeroSection.tsx` |
| 3 | 优化 GlassCard 交互 | `components/home/HeroSection.tsx` |
| 4 | 测试响应式布局 | - |

### 5.3 第三阶段：FeaturedHighlights（预计 1-2 小时）

| 步骤 | 任务 | 文件 |
|------|------|------|
| 1 | 优化卡片入场动画 | `components/home/FeaturedHighlights.tsx` |
| 2 | 优化 Hover 效果 | `components/home/FeaturedHighlights.tsx` |
| 3 | 添加点击反馈 | `components/home/FeaturedHighlights.tsx` |
| 4 | 添加 Badge 呼吸动画 | `components/home/FeaturedHighlights.tsx` |

### 5.4 第四阶段：StatsPanel（预计 2-3 小时）

| 步骤 | 任务 | 文件 |
|------|------|------|
| 1 | 实现数字滚动动画 | `components/home/StatsPanel.tsx` |
| 2 | 配置图表动画 | `components/home/StatsPanel.tsx` |
| 3 | 优化卡片 Hover | `components/home/StatsPanel.tsx` |
| 4 | 优化实时指示器 | `components/home/StatsPanel.tsx` |

### 5.5 第五阶段：ProfileCard（预计 1-2 小时）

| 步骤 | 任务 | 文件 |
|------|------|------|
| 1 | 优化入场动画 | `components/home/ProfileCard.tsx` |
| 2 | 优化展开/收起动画 | `components/home/ProfileCard.tsx` |
| 3 | 添加头像交互 | `components/home/ProfileCard.tsx` |
| 4 | 优化按钮反馈 | `components/home/ProfileCard.tsx` |

### 5.6 第六阶段：其他组件（预计 1-2 小时）

| 步骤 | 任务 | 文件 |
|------|------|------|
| 1 | 优化 FriendLinks | `components/home/FriendLinks.tsx` |
| 2 | 优化 WaveStack | `components/ui/WaveStack.tsx` |
| 3 | 全局测试和微调 | - |

---

## 6. 测试验证

### 6.1 视觉测试清单

- [ ] 所有动画流畅无卡顿
- [ ] 动画时长一致（150ms/300ms/500ms）
- [ ] 缓动曲线统一
- [ ] 阴影过渡平滑
- [ ] 毛玻璃效果正常

### 6.2 交互测试清单

- [ ] Hover 效果响应及时
- [ ] 点击反馈正确触发
- [ ] 滚动触发动画正确
- [ ] 移动端触摸交互正常

### 6.3 性能测试清单

- [ ] 动画帧率 ≥ 60fps
- [ ] 无内存泄漏
- [ ] 首屏加载时间正常
- [ ] Lighthouse 性能评分 ≥ 90

### 6.4 兼容性测试清单

- [ ] Chrome 最新版
- [ ] Safari 最新版
- [ ] Firefox 最新版
- [ ] iOS Safari
- [ ] Android Chrome

---

## 附录

### A. 参考资料

- [Apple Human Interface Guidelines - Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [CSS Tricks - Easing Functions](https://css-tricks.com/ease-out-in-ease-in-out/)

### B. 动画对比

| 效果 | 科技风格 | 苹果风格 |
|------|----------|----------|
| 卡片 Hover | 边框发光 + 旋转 | 上浮 + 阴影加深 |
| 入场动画 | 缩放 + 发光 | 淡入 + 上移 |
| 数字动画 | 无 | 平滑滚动 |
| 指示器 | 强烈脉冲 | 柔和呼吸 |
| 波浪 | 复杂变形 | 柔和移动 |

### C. 代码规范

- 使用 Framer Motion 处理复杂动画
- 使用 CSS 处理简单过渡
- 避免在动画中使用 `will-change` 除非必要
- 使用 `transform` 和 `opacity` 实现动画（GPU 加速）
- 避免在动画中改变 `width`、`height`、`margin` 等触发重排的属性
