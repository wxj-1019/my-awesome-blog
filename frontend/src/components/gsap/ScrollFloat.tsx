'use client';

import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ensureGsapPlugins } from '@/lib/gsap/registry';
import { SCROLL_FLOAT, SCROLL_VIEWPORT } from '@/lib/gsap/scroll-presets';
import { cn } from '@/lib/utils';

interface ScrollFloatProps {
  children: ReactNode;
  className?: string;
  /** 视差幅度（px） */
  distance?: number;
}

/**
 * L3：轻量滚动视差（urban-jungle 简化，禁止列表大面积使用）
 */
export default function ScrollFloat({
  children,
  className,
  distance = SCROLL_FLOAT.y,
}: ScrollFloatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced) {
        return;
      }

      // 移动端弱化
      if (window.matchMedia('(max-width: 768px)').matches) {
        return;
      }

      const gsap = ensureGsapPlugins();
      gsap.fromTo(
        el,
        { y: distance * 0.35 },
        {
          y: -distance * 0.35,
          ease: SCROLL_FLOAT.ease,
          scrollTrigger: {
            trigger: el,
            ...SCROLL_VIEWPORT.SCRUB,
          },
        }
      );
    },
    { scope: ref, dependencies: [reduced, distance] }
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
