'use client';

import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ensureGsapPlugins } from '@/lib/gsap/registry';
import { SCROLL_REVEAL, SCROLL_VIEWPORT } from '@/lib/gsap/scroll-presets';
import { cn } from '@/lib/utils';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

/**
 * L3：滚动进入视口后 reveal（GSAP only）
 */
export default function ScrollReveal({
  children,
  className,
  delay = 0,
  y = SCROLL_REVEAL.y,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) {
        return;
      }

      const gsap = ensureGsapPlugins();

      if (reduced) {
        gsap.set(el, { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        el,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration: SCROLL_REVEAL.duration,
          delay,
          ease: SCROLL_REVEAL.ease,
          scrollTrigger: {
            trigger: el,
            ...SCROLL_VIEWPORT.ONCE,
          },
        }
      );
    },
    { scope: ref, dependencies: [reduced, delay, y] }
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
