'use client';

import { useEffect, useState } from 'react';

export type TocHeading = { id: string; text: string; level: number };

/**
 * 根据标题进入视口高亮当前章节（IntersectionObserver）。
 * 延迟绑定：等 Markdown 把 id 挂到 DOM 后再 observe。
 */
export function useActiveHeading(headings: TocHeading[]): string {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (headings.length === 0) {
      setActiveId('');
      return;
    }

    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    let retryTimer: number | undefined;

    const bind = () => {
      if (cancelled) {
        return;
      }
      const elements = headings
        .map((h) => document.getElementById(h.id))
        .filter((el): el is HTMLElement => Boolean(el));

      if (elements.length === 0) {
        retryTimer = window.setTimeout(bind, 80);
        return;
      }

      const visibility = new Map<string, number>();

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            visibility.set(
              entry.target.id,
              entry.isIntersecting ? entry.intersectionRatio : 0
            );
          }
          let bestId = '';
          let bestRatio = 0;
          for (const el of elements) {
            const ratio = visibility.get(el.id) ?? 0;
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestId = el.id;
            }
          }
          if (bestId) {
            setActiveId(bestId);
            return;
          }
          const scrollY = window.scrollY + 120;
          let fallback = elements[0].id;
          for (const el of elements) {
            if (el.offsetTop <= scrollY) {
              fallback = el.id;
            }
          }
          setActiveId(fallback);
        },
        {
          rootMargin: '-15% 0px -55% 0px',
          threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
        }
      );

      for (const el of elements) {
        observer.observe(el);
      }
    };

    bind();

    return () => {
      cancelled = true;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      observer?.disconnect();
    };
  }, [headings]);

  return activeId;
}
