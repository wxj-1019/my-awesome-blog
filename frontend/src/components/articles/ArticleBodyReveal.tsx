'use client';

import { useEffect, type RefObject, type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const SELECTOR = 'p, h2, h3, h4, pre, img, blockquote, table, ul, ol';
const MAX_BLOCKS = 12;

interface ArticleBodyRevealProps {
  contentRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
  /** 是否启用（桌面开、移动关） */
  enabled?: boolean;
}

/**
 * 桌面：正文前 MAX_BLOCKS 个块级节点 once fade-up（原生 IO + CSS，不抢 Framer 节点）。
 * 移动 / reduced-motion：无动画。
 */
export default function ArticleBodyReveal({
  contentRef,
  children,
  className,
  enabled = true,
}: ArticleBodyRevealProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = contentRef.current;
    if (!root || !enabled || reduced) {
      return;
    }

    // 仅桌面
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 1023px)').matches
    ) {
      return;
    }

    const nodes = Array.from(root.querySelectorAll<HTMLElement>(SELECTOR)).slice(
      0,
      MAX_BLOCKS
    );
    if (nodes.length === 0) {
      return;
    }

    const cleanups: Array<() => void> = [];

    for (const el of nodes) {
      const prevTransition = el.style.transition;
      const prevOpacity = el.style.opacity;
      const prevTransform = el.style.transform;
      el.style.opacity = '0';
      el.style.transform = 'translate3d(0, 14px, 0)';
      el.style.transition =
        'opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1), transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';

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

    return () => {
      for (const fn of cleanups) {
        fn();
      }
    };
  }, [contentRef, enabled, reduced]);

  return <div className={className}>{children}</div>;
}
