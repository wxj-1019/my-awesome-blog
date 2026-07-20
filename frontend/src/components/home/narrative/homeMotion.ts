/**
 * 首页「深海 × 电影」：共享动效节奏与预算。
 *
 * 一期：act / dive / bubbles / glow
 * 二期：reel（展厅卷轴）/ current（洋流路径）
 * 四期：dive 入水装置 / depth 分幕环境 / 展厅光影
 *
 * 预算：
 * - L0 reduced-motion：无循环、无 drift、path 满绘；气泡不渲染
 * - L1 移动：卷轴 snap 横滑；洋流静态线；Dive 光柱静态
 * - L2 桌面：焦点景深 + 洋流描边进度 + Dive 色温 scrub
 * - 持续循环允许：浪（WaveStack）+ 多源稀疏气泡（见 HOME_BUBBLE_COUNT*）
 *   · Hero 出口：HOME_BUBBLE_COUNT（桌 16 / 移 8）
 *   · Dive 入水：HOME_BUBBLE_COUNT_UNDERWATER（桌 8 / 移 4，无高光）
 *   · 全局 AmbientBackground：桌 6 / 移 3（无高光；非本文件常量）
 * - 禁止：矩阵雨、Reel 自动漂移、每幕无限光扫
 */

import { EASE, TRANSITION } from '@/lib/animation-utils';

export const HOME_EASE = EASE.SNAPPY;

export const HOME_DURATION = {
  act: 0.55,
  content: 0.5,
  dive: 0.9,
  waveEnter: 1.1,
  reelSnap: 0.45,
} as const;

export const HOME_STAGGER = 0.08;

export const HOME_VIEWPORT = {
  once: true,
  amount: 0.2 as const,
  margin: '0px 0px -8% 0px',
} as const;

export const HOME_TRANSITION = {
  act: {
    duration: HOME_DURATION.act,
    ease: HOME_EASE,
  },
  content: {
    ...TRANSITION.DEFAULT,
    duration: HOME_DURATION.content,
    ease: HOME_EASE,
  },
  waveEnter: {
    delay: 0.5,
    duration: HOME_DURATION.waveEnter,
    ease: HOME_EASE,
  },
  reelSnap: {
    duration: HOME_DURATION.reelSnap,
    ease: HOME_EASE,
  },
} as const;

export const HOME_BUBBLE_COUNT = {
  desktop: 16,
  mobile: 8,
} as const;

export const HOME_GLOW = {
  size: 280,
  color: 'rgba(6, 182, 212, 0.08)',
} as const;

/** 展厅卷轴：焦点与拖拽阈值（自动漂移默认关） */
export const HOME_REEL = {
  /** 指针移动超过该 px 视为拖拽，避免误触 Link */
  dragThreshold: 8,
  /** 焦点卡 scale */
  focusScale: 1.04,
  /** 邻卡 scale */
  sideScale: 0.92,
  /** 邻卡透明度 */
  sideOpacity: 0.72,
  /** 卡最小宽度（px，与 CSS 对齐） */
  cardMinWidth: 280,
  /** 自动漂移：二期默认 false */
  autoDrift: false,
} as const;

/** 洋流路径描边 */
export const HOME_CURRENT = {
  /** 描边进度更新节流 ms */
  progressThrottle: 32,
  strokeWidth: 2,
} as const;

/**
 * 四期 · 入水装置（DiveTransition）
 * 色带三层 + 折光线 + GSAP scrub 光柱；移动 / RM 全部静态终态。
 * 主折光与光柱的 opacity / autoAlpha / y 仅由 GSAP 写入（单一来源，勿再加 class opacity）。
 */
export const HOME_DIVE = {
  /** 装置高度（较一期 h-24/32 加厚，让「潜下去」有过程） */
  heightMobile: 'h-40',
  heightDesktop: 'sm:h-56',
  /** 主折光线：GSAP 目标 opacity（桌面 scrub 终点 / 移动·RM 终态） */
  shimmerOpacity: 0.3,
  /** 光柱：GSAP 目标 autoAlpha（渐变为 token 淡色；勿与 Tailwind opacity-* 叠乘） */
  lightShaftOpacity: 0.45,
} as const;

/**
 * 四期 · 水下残影气泡（较 Hero 减半，控制 DOM 与预算）
 */
export const HOME_BUBBLE_COUNT_UNDERWATER = {
  desktop: 8,
  mobile: 4,
} as const;

/**
 * 四期 · 分幕环境深度（DepthAmbience）。
 * 数值为 color-mix 百分比预算；实际色彩走 CSS 变量 token，不写裸色值。
 * glow = 主光斑强度；tint = 整体水色基调；vignette = 边缘暗角。
 */
export const HOME_DEPTH = {
  /** 第一幕 · 展厅（浅水）：顶光略亮 + 轻暗角 */
  shallow: { glow: 13, tint: 5, vignette: 12 },
  /** 第二幕 · 仪表/栈（舱内）：整体压暗一档 + 舷窗式侧暗 */
  cabin: { glow: 6, tint: 12, vignette: 16 },
  /** 第三幕 · 洋流（深层）：中轴两侧弱水色晕 */
  current: { glow: 8, tint: 7, vignette: 12 },
  /** 第四幕 · 靠岸（上浮）：底部提亮、几乎无暗角 */
  shore: { glow: 12, tint: 4, vignette: 6 },
} as const;

export type HomeDepth = keyof typeof HOME_DEPTH;
