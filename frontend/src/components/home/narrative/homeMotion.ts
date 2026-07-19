/**
 * 首页「深海 × 电影」：共享动效节奏与预算。
 *
 * 一期：act / dive / bubbles / glow
 * 二期：reel（展厅卷轴）/ current（洋流路径）
 *
 * 预算：
 * - L0 reduced-motion：无循环、无 drift、path 满绘
 * - L1 移动：卷轴 snap 横滑；洋流静态线
 * - L2 桌面：焦点景深 + 洋流描边进度
 * - 默认持续循环仍仅浪+气泡（无自动 drift）
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
