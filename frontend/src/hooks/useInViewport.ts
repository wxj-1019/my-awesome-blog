'use client';

import { useEffect, useState, type RefObject } from 'react';

interface UseInViewportOptions {
  /** 视口外预渲染距离（px），避免滚动到边缘时空白 */
  rootMargin?: string;
  /** 仅进入视口一次后不再观察（适合入场动画） */
  once?: boolean;
}

/**
 * 基于 IntersectionObserver 的视口检测 hook。
 * IO 不可用（SSR / 旧环境 / jest）时降级为「始终可见」，保证内容可达。
 */
export function useInViewport(
  ref: RefObject<Element | null>,
  { rootMargin = '200px 0px', once = false }: UseInViewportOptions = {}
): boolean {
  const [inViewport, setInViewport] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {return;}

    // IO 不可用时降级为始终可见
    if (typeof IntersectionObserver === 'undefined') {
      setInViewport(true);
      return;
    }

    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (cancelled) {break;}
          if (entry.isIntersecting) {
            setInViewport(true);
            if (once) {observer.disconnect();}
          } else if (!once) {
            setInViewport(false);
          }
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [ref, rootMargin, once]);

  return inViewport;
}
