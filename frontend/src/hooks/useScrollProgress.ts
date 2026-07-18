'use client';

import { useEffect, useState, type RefObject } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * 计算元素在视口中的滚动进度 0–1（crypto-wealth 模式简化版）。
 * - 默认监听 window scroll
 * - reduced-motion 时固定为 0，避免依赖进度的动画
 */
export function useScrollProgress(
  targetRef?: RefObject<HTMLElement | null>,
  options?: { offsetStart?: number; offsetEnd?: number }
): number {
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const offsetStart = options?.offsetStart ?? 0;
  const offsetEnd = options?.offsetEnd ?? 0;

  useEffect(() => {
    if (reducedMotion) {
      setProgress(0);
      return;
    }

    let frame = 0;

    const measure = () => {
      frame = 0;
      const el = targetRef?.current;
      const scrollY = window.scrollY || window.pageYOffset;
      const vh = window.innerHeight;

      if (!el) {
        // 文档级：0 在顶部，1 在可滚动底部
        const max = Math.max(document.documentElement.scrollHeight - vh, 1);
        setProgress(Math.min(1, Math.max(0, scrollY / max)));
        return;
      }

      const rect = el.getBoundingClientRect();
      const start = scrollY + rect.top - vh + offsetStart;
      const end = scrollY + rect.bottom + offsetEnd;
      const range = Math.max(end - start, 1);
      const raw = (scrollY - start) / range;
      setProgress(Math.min(1, Math.max(0, raw)));
    };

    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [reducedMotion, targetRef, offsetStart, offsetEnd]);

  return progress;
}
