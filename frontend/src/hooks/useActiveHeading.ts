'use client';

import { useEffect, useState } from 'react';

export type TocHeading = { id: string; text: string; level: number };

/**
 * 根据标题进入视口高亮当前章节（IntersectionObserver）。
 */
export function useActiveHeading(headings: TocHeading[]): string {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (headings.length === 0) {
      setActiveId('');
      return;
    }

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) {
      return;
    }

    const visibility = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(
            entry.target.id,
            entry.isIntersecting ? entry.intersectionRatio : 0
          );
        }
        // 取可见比例最高的标题；都不可见时取已滚过的最后一个
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
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}
