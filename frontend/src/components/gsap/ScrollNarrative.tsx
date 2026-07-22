'use client';

import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ensureGsapPlugins } from '@/lib/gsap/registry';
import { cn } from '@/lib/utils';

interface ScrollNarrativeProps {
  children: ReactNode;
  className?: string;
}

/**
 * L3：分区滚动叙事容器（about / contact 分区层，与首页接续引线同源）。
 * - 容器轻微视差：y 24 → -12（ScrollTrigger scrub: 1）
 * - 内部 [data-scroll-line] 揭示线：scaleX 0 → 1 随滚动绘制（origin-left）
 *
 * 铁律：容器 y 与揭示线 transform 仅由 GSAP 写入（单一来源，不与 Tailwind
 * transform/opacity 类叠乘）；reduced-motion 与移动端（max-width 768px）不建
 * scrub 时间线——容器保持原位、揭示线直接 gsap.set 终态（照 DiveTransition 回退结构）。
 */
export default function ScrollNarrative({ children, className }: ScrollNarrativeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) {
        return;
      }

      const gsap = ensureGsapPlugins();
      const line = root.querySelector<HTMLElement>('[data-scroll-line]');

      // reduced-motion / 移动端：不建时间线，揭示线直接落终态，容器不做视差
      if (reduced || window.matchMedia('(max-width: 768px)').matches) {
        if (line) {
          gsap.set(line, { scaleX: 1 });
        }
        return;
      }

      // 分区容器轻微 scrub 视差
      gsap.fromTo(
        root,
        { y: 24 },
        {
          y: -12,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        }
      );

      // 标题下渐变揭示线：随滚动从左向右绘制
      if (line) {
        gsap.fromTo(
          line,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            transformOrigin: 'left center',
            scrollTrigger: {
              trigger: root,
              start: 'top 85%',
              end: 'top 40%',
              scrub: 1,
            },
          }
        );
      }
    },
    { scope: ref, dependencies: [reduced] }
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}

interface ScrollRevealLineProps {
  className?: string;
}

/**
 * 分区标题下的渐变揭示线。
 * transform 仅由外层 ScrollNarrative 的 GSAP 写入；inline 初值 scaleX(0)
 * 避免 hydration 前引线完整闪现（reduced / 移动端由 GSAP set 回终态）。
 */
export function ScrollRevealLine({ className }: ScrollRevealLineProps) {
  return (
    <div
      data-scroll-line
      aria-hidden
      className={cn('mt-4 h-px w-16 bg-gradient-to-r from-primary/70 to-transparent', className)}
      style={{ transform: 'scaleX(0)', transformOrigin: 'left center' }}
    />
  );
}
