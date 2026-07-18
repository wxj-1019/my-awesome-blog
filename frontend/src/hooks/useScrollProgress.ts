'use client';

import { useCallback, useState, type RefObject } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSharedWindowScroll } from '@/hooks/useSharedWindowScroll';

/**
 * 计算元素在视口中的滚动进度 0–1（crypto-wealth 模式简化版）。
 * - 与 useReadingProgress 共用 window scroll 单例
 * - reduced-motion 时固定为 0
 */
export function useScrollProgress(
  targetRef?: RefObject<HTMLElement | null>,
  options?: { offsetStart?: number; offsetEnd?: number }
): number {
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const offsetStart = options?.offsetStart ?? 0;
  const offsetEnd = options?.offsetEnd ?? 0;

  const measure = useCallback(() => {
    if (reducedMotion) {
      setProgress(0);
      return;
    }

    const el = targetRef?.current;
    const scrollY = window.scrollY || window.pageYOffset;
    const vh = window.innerHeight;

    if (!el) {
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
  }, [reducedMotion, targetRef, offsetStart, offsetEnd]);

  useSharedWindowScroll(measure, !reducedMotion);

  return progress;
}
