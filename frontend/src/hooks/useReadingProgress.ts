'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * 正文阅读进度 0–100。
 * 供顶栏 ReadingProgressBar 与 TOC 侧轨共用，避免双份 scroll 计算。
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
      const contentTop = el.offsetTop;
      const contentHeight = Math.max(el.offsetHeight, 1);
      const windowHeight = window.innerHeight;
      const scrollTop = window.scrollY;
      const raw =
        ((scrollTop - contentTop + windowHeight) / contentHeight) * 100;
      setProgress(Math.round(Math.min(100, Math.max(0, raw))));
    };

    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(measure);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    measure();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [contentRef]);

  return progress;
}
