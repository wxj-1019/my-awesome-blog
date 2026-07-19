'use client';

import { useEffect, useState, type RefObject, type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const SELECTOR = 'p, h2, h3, h4, pre, img, blockquote, table, ul, ol';
/** 阶段 B：更少入场块，降低长文滚动负担 */
const MAX_BLOCKS = 8;

interface ArticleBodyRevealProps {
  /** 可选：扫描该节点；不传则用组件自身 root */
  contentRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
  enabled?: boolean;
}

/**
 * 桌面：正文前 MAX_BLOCKS 个块级节点 once fade-up（原生 IO + CSS）。
 * 移动 / reduced-motion：无动画。
 */
export default function ArticleBodyReveal({
  contentRef,
  children,
  className,
  enabled = true,
}: ArticleBodyRevealProps) {
  const reduced = useReducedMotion();
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = contentRef?.current ?? rootEl;
    if (!root || !enabled || reduced) {
      return;
    }

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 1023px)').matches
    ) {
      return;
    }

    let cancelled = false;
    let cleanups: Array<() => void> = [];
    let retryTimer: number | undefined;

    const setup = () => {
      if (cancelled) {
        return;
      }
      const nodes = Array.from(
        root.querySelectorAll<HTMLElement>(SELECTOR)
      ).slice(0, MAX_BLOCKS);
      if (nodes.length === 0) {
        retryTimer = window.setTimeout(setup, 80);
        return;
      }

      for (const el of nodes) {
        const prevTransition = el.style.transition;
        const prevOpacity = el.style.opacity;
        const prevTransform = el.style.transform;
        el.style.opacity = '0';
        el.style.transform = 'translate3d(0, 8px, 0)';
        el.style.transition =
          'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

        const io = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                el.style.opacity = '1';
                el.style.transform = 'translate3d(0, 0, 0)';
                io.unobserve(el);
              }
            }
          },
          { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
        );
        io.observe(el);
        cleanups.push(() => {
          io.disconnect();
          el.style.transition = prevTransition;
          el.style.opacity = prevOpacity;
          el.style.transform = prevTransform;
        });
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      for (const fn of cleanups) {
        fn();
      }
      cleanups = [];
    };
  }, [contentRef, rootEl, enabled, reduced]);

  return (
    <div ref={setRootEl} className={className}>
      {children}
    </div>
  );
}
