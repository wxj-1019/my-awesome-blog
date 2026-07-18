'use client';

import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ensureGsapPlugins } from '@/lib/gsap/registry';
import { SCROLL_VIEWPORT } from '@/lib/gsap/scroll-presets';
import { cn } from '@/lib/utils';

interface ParallaxLayerProps {
  children: ReactNode;
  className?: string;
  /** 速度系数，1 = 与滚动同步，0.3 更慢（背景感） */
  speed?: number;
}

/**
 * L3：视差层（勿与外层 Motion transform 叠在同一节点）
 */
export default function ParallaxLayer({
  children,
  className,
  speed = 0.35,
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced) {
        return;
      }
      if (window.matchMedia('(max-width: 768px)').matches) {
        return;
      }

      const gsap = ensureGsapPlugins();
      const travel = 80 * speed;

      gsap.fromTo(
        el,
        { y: -travel },
        {
          y: travel,
          ease: 'none',
          scrollTrigger: {
            trigger: el.parentElement || el,
            ...SCROLL_VIEWPORT.SCRUB,
          },
        }
      );
    },
    { scope: ref, dependencies: [reduced, speed] }
  );

  return (
    <div ref={ref} className={cn('will-change-transform', className)}>
      {children}
    </div>
  );
}
