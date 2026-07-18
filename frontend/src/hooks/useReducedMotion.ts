'use client';

import { useState, useEffect } from 'react';

/**
 * 检测用户是否偏好减少动画
 * 遵循 WCAG 关于 prefers-reduced-motion 的指南
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * 性能优化的动画配置
 */
export function useAnimationConfig() {
  const reducedMotion = useReducedMotion();

  return {
    // 是否禁用动画
    disabled: reducedMotion,
    // 动画时长缩放（减少动画时降低）
    durationScale: reducedMotion ? 0 : 1,
    // 弹簧配置
    spring: reducedMotion
      ? { stiffness: 1000, damping: 100, mass: 0.1 }
      : { stiffness: 300, damping: 30, mass: 1 },
    // 淡入淡出时长
    fadeDuration: reducedMotion ? 0.1 : 0.3,
    // 缩放动画时长
    scaleDuration: reducedMotion ? 0.1 : 0.2,
    // 位移动画时长
    slideDuration: reducedMotion ? 0.1 : 0.4
  };
}

/**
 * 优化的 CSS transform 属性
 * 使用 GPU 加速的属性
 */
export const GPU_ACCELERATED_PROPS = {
  transform: true,
  opacity: true,
  filter: false // 避免使用，性能开销大
} as const;

/**
 * 判断是否使用 will-change
 * 避免滥用导致的性能问题
 */
export function useWillChange(isAnimating: boolean): string {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) {return 'auto';}
  return isAnimating ? 'transform, opacity' : 'auto';
}
