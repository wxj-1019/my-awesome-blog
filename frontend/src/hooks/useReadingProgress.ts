'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * 正文阅读进度 0–100。
 * 供顶栏 ReadingProgressBar 与 TOC 侧轨共用，避免双份 scroll 计算。
 * 使用 getBoundingClientRect，避免 offsetTop 在 sticky/transform 下失真。
 */
export function useReadingProgress(
  contentRef: RefObject<HTMLElement | null>
): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
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
    };

    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(measure);
    };

    const boot = window.setTimeout(measure, 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.clearTimeout(boot);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [contentRef]);

  return progress;
}
