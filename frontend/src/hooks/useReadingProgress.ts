'use client';

import { useCallback, useState, type RefObject } from 'react';
import { useSharedWindowScroll } from '@/hooks/useSharedWindowScroll';

/**
 * 正文阅读进度 0–100。
 * 与封面视差等共用 useSharedWindowScroll，单 rAF 链路。
 */
export function useReadingProgress(
  contentRef: RefObject<HTMLElement | null>
): number {
  const [progress, setProgress] = useState(0);

  const measure = useCallback(() => {
    const el = contentRef.current;
    if (!el) {
      setProgress(0);
      return;
    }
    const rect = el.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const vh = window.innerHeight;
    const contentTop = scrollY + rect.top;
    const contentHeight = Math.max(rect.height, 1);
    const raw = ((scrollY + vh - contentTop) / contentHeight) * 100;
    setProgress(Math.round(Math.min(100, Math.max(0, raw))));
  }, [contentRef]);

  useSharedWindowScroll(measure, true);

  return progress;
}
