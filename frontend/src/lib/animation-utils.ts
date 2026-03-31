/**
 * 动画工具库 - 提供统一的动画预设和工具函数
 * 
 * 使用 Framer Motion 语法，支持入场/出场/悬停等动画效果
 */

import { Variants, Transition } from 'framer-motion'

// ============================================
// 缓动函数预设
// ============================================
export const EASE = {
  // Apple 风格缓动
  APPLE: [0.25, 0.1, 0.25, 1] as const,
  // 弹性缓动
  BOUNCE: [0.68, -0.55, 0.265, 1.55] as const,
  // 平滑缓动
  SMOOTH: [0.4, 0, 0.2, 1] as const,
  // 迅捷缓动
  SNAPPY: [0.16, 1, 0.3, 1] as const,
  // 弹簧效果
  SPRING: { type: 'spring', stiffness: 300, damping: 25 } as const,
}

// ============================================
// 过渡配置预设
// ============================================
export const TRANSITION: Record<string, Transition> = {
  DEFAULT: {
    duration: 0.6,
    ease: EASE.APPLE,
  },
  FAST: {
    duration: 0.3,
    ease: EASE.SNAPPY,
  },
  SLOW: {
    duration: 0.8,
    ease: EASE.SMOOTH,
  },
  SPRING: {
    type: 'spring',
    stiffness: 300,
    damping: 25,
  },
  BOUNCE: {
    type: 'spring',
    stiffness: 400,
    damping: 15,
  },
}

// ============================================
// 入场动画变体
// ============================================
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: TRANSITION.DEFAULT,
  },
  exit: {
    opacity: 0,
    transition: TRANSITION.FAST,
  },
}

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: TRANSITION.DEFAULT,
  },
  exit: {
    opacity: 0,
    y: -30,
    transition: TRANSITION.FAST,
  },
}

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: TRANSITION.DEFAULT,
  },
  exit: {
    opacity: 0,
    y: 30,
    transition: TRANSITION.FAST,
  },
}

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: TRANSITION.DEFAULT,
  },
  exit: {
    opacity: 0,
    x: 50,
    transition: TRANSITION.FAST,
  },
}

export const slideRight: Variants = {
  hidden: { opacity: 0, x: 80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: TRANSITION.DEFAULT,
  },
  exit: {
    opacity: 0,
    x: -50,
    transition: TRANSITION.FAST,
  },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: TRANSITION.DEFAULT,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: TRANSITION.FAST,
  },
}

export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.5, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: TRANSITION.FAST,
  },
}

// 弹跳入场
export const bounceIn: Variants = {
  hidden: { opacity: 0, scale: 0.3, y: 50 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: TRANSITION.FAST,
  },
}

// 翻转入场
export const flipIn: Variants = {
  hidden: { opacity: 0, rotateX: -90 },
  visible: {
    opacity: 1,
    rotateX: 0,
    transition: {
      duration: 0.6,
      ease: EASE.APPLE,
    },
  },
  exit: {
    opacity: 0,
    rotateX: 45,
    transition: TRANSITION.FAST,
  },
}

// ============================================
// 容器交错动画变体
// ============================================
export const staggerContainer = (staggerChildren = 0.1, delayChildren = 0): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: staggerChildren * 0.5,
      staggerDirection: -1,
    },
  },
})

// 交错子元素
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: TRANSITION.DEFAULT,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: TRANSITION.FAST,
  },
}

// 交错缩放子元素
export const staggerScaleItem: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: TRANSITION.FAST,
  },
}

// ============================================
// 特殊效果变体
// ============================================

// 发光脉冲效果
export const glowPulse: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: EASE.APPLE,
    },
  },
}

// 线条展开效果
export const lineExpand: Variants = {
  hidden: { scaleX: 0, originX: 0.5 },
  visible: {
    scaleX: 1,
    transition: {
      duration: 0.8,
      ease: EASE.SMOOTH,
    },
  },
}

// 圆形扩散效果
export const circleExpand: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  },
}

// ============================================
// 视口检测配置
// ============================================
export const VIEWPORT = {
  // 只触发一次
  ONCE: { once: true, margin: '-100px' as const },
  // 每次进入都触发
  ALWAYS: { margin: '-50px' as const },
  // 较早触发
  EARLY: { once: true, margin: '-200px' as const },
  // 较晚触发
  LATE: { once: true, margin: '-50px' as const },
}

// ============================================
// 悬停效果
// ============================================
export const hover = {
  // 轻微上浮
  LIFT: { y: -4, transition: TRANSITION.SPRING },
  // 缩放
  SCALE: { scale: 1.02, transition: TRANSITION.SPRING },
  // 发光
  GLOW: {
    boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)',
    transition: TRANSITION.DEFAULT,
  },
  // 卡片效果
  CARD: {
    y: -8,
    scale: 1.02,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    transition: TRANSITION.SPRING,
  },
}

// ============================================
// 工具函数
// ============================================

/**
 * 生成延迟的变体
 */
export function withDelay(variants: Variants, delay: number): Variants {
  return {
    ...variants,
    visible: {
      ...(variants.visible as Record<string, unknown>),
      transition: {
        ...((variants.visible as Record<string, unknown>)?.transition as Record<string, unknown>),
        delay,
      },
    },
  }
}

/**
 * 自定义弹簧配置
 */
export function springConfig(stiffness: number, damping: number) {
  return {
    type: 'spring' as const,
    stiffness,
    damping,
  }
}

/**
 * 计算交错延迟
 */
export function calculateStaggerDelay(index: number, baseDelay = 0.1, maxDelay = 0.5): number {
  return Math.min(index * baseDelay, maxDelay)
}

// ============================================
// 预设组合
// ============================================
export const PRESETS = {
  // 标准卡片入场
  CARD: slideUp,
  // 网格项入场
  GRID_ITEM: scaleIn,
  // 侧边栏入场
  SIDEBAR: slideLeft,
  // 内容区入场
  CONTENT: slideRight,
  // 标题入场
  TITLE: slideDown,
  // 弹窗/对话框入场
  MODAL: scaleUp,
  // 小元素入场
  BADGE: bounceIn,
} as const
