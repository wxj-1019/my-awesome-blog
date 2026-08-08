'use client';

import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { cn } from '@/lib/utils';
import BubbleField from '../BubbleField';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ensureGsapPlugins } from '@/lib/gsap/registry';
import { HOME_BUBBLE_COUNT_UNDERWATER, HOME_DIVE } from './homeMotion';

/**
 * 片头 → 水下展厅：多层入水装置。
 *
 * 结构（全部纯装饰，不拦截指针）：
 * - 三层色带：水面折射 → 水体过渡 → 水下定调（token 色，无裸十六进制）
 * - 折光线 ×2：主折光由 GSAP scrub 灌入（桌面），副折光静态
 * - 光柱 ×3：主光柱自上而下径向渐变，GSAP scrub 淡入下沉（桌面）；
 *   左右两根窄副光柱静态弱光补纵深；移动 / RM 全部静态
 * - 残影气泡：复用 BubbleField，数量减半、省略高光以控制 DOM
 *
 * 铁律：主折光与光柱的 opacity/autoAlpha/y **仅由 GSAP 写入**（初值 inline 0，
 * 禁止 Tailwind opacity-* 与 GSAP 叠乘）；副折光与色带几何为静态 CSS。
 */
export default function DiveTransition({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) {
        return;
      }

      const gsap = ensureGsapPlugins();
      const shimmer = root.querySelector<HTMLElement>('[data-dive-shimmer="primary"]');
      const shaft = root.querySelector<HTMLElement>('[data-dive-lightshaft]');
      const deep = root.querySelector<HTMLElement>('[data-dive-band="deep"]');

      // opacity / autoAlpha / y 仅由 GSAP 写入（单一来源，避免 class 与 inline 叠乘语义）
      // 移动端 / RM：直接落到静态终态
      if (reduced || window.matchMedia('(max-width: 768px)').matches) {
        if (shimmer) {
          gsap.set(shimmer, { opacity: HOME_DIVE.shimmerOpacity });
        }
        if (shaft) {
          gsap.set(shaft, { autoAlpha: HOME_DIVE.lightShaftOpacity, y: 0 });
        }
        if (deep) {
          gsap.set(deep, { opacity: 1 });
        }
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });

      // 入水三段：折光灌入 → 光柱下沉 → 深层色带定调
      if (shimmer) {
        tl.fromTo(
          shimmer,
          { opacity: 0 },
          { opacity: HOME_DIVE.shimmerOpacity, ease: 'none' },
          0
        );
      }
      if (shaft) {
        tl.fromTo(
          shaft,
          { autoAlpha: 0, y: -20 },
          { autoAlpha: HOME_DIVE.lightShaftOpacity, y: 10, ease: 'none' },
          0
        );
      }
      if (deep) {
        tl.fromTo(deep, { opacity: 0.55 }, { opacity: 1, ease: 'none' }, 0);
      }
    },
    { scope: rootRef, dependencies: [reduced] }
  );

  return (
    <div
      ref={rootRef}
      data-dive-root
      className={cn('relative pointer-events-none -mt-6 sm:-mt-10 z-10', className)}
      aria-hidden
    >
      <div
        className={cn(
          'relative w-full overflow-hidden',
          HOME_DIVE.heightMobile,
          HOME_DIVE.heightDesktop
        )}
      >
        {/* 色带 · 上：水面折射（透明 → 淡主色） */}
        <div
          data-dive-band="surface"
          className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-transparent via-primary/[0.18] to-primary/[0.28]"
        />
        {/* 色带 · 中：水体过渡（主色 → 深水蓝） */}
        <div
          data-dive-band="mid"
          className="absolute inset-x-0 top-1/3 h-1/3 bg-gradient-to-b from-primary/[0.28] via-primary/[0.20] to-tech-deepblue/45"
        />
        {/* 色带 · 下：水下定调（深水蓝收进背景；桌面由 GSAP 灌至全深） */}
        <div
          data-dive-band="deep"
          className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-b from-tech-deepblue/45 via-tech-deepblue/28 to-background"
        />

        {/* 主折光线：opacity 仅由 GSAP 写入（见 useGSAP）；hydration 前透明避免闪一下 */}
        <div
          data-dive-shimmer="primary"
          className="absolute inset-x-0 top-[30%] h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          style={{ opacity: 0 }}
        />
        {/* 副折光线：更细更淡，静态（不走 GSAP） */}
        <div
          data-dive-shimmer="secondary"
          className="absolute inset-x-[15%] top-[55%] h-px bg-gradient-to-r from-transparent via-tech-lightcyan/30 to-transparent"
        />

        {/* 光柱：径向渐变成锥形；opacity/y 仅 GSAP；mx-auto 不与 y 抢 transform */}
        <div
          data-dive-lightshaft
          className="absolute inset-x-0 top-0 mx-auto h-full w-[58%]"
          style={{
            opacity: 0,
            background:
              'radial-gradient(ellipse 55% 100% at 50% 0%, color-mix(in srgb, var(--primary) 32%, transparent), transparent 72%)',
          }}
        />
        {/* 副光柱：偏左窄柱，静态弱光，增加纵深 */}
        <div
          data-dive-lightshaft="secondary"
          className="absolute top-0 left-[18%] h-full w-[16%]"
          style={{
            opacity: 0.5,
            background:
              'radial-gradient(ellipse 60% 100% at 50% 0%, color-mix(in srgb, var(--tech-lightcyan) 16%, transparent), transparent 75%)',
          }}
        />
        {/* 副光柱：偏右窄柱，静态弱光 */}
        <div
          data-dive-lightshaft="tertiary"
          className="absolute top-0 right-[16%] h-full w-[14%]"
          style={{
            opacity: 0.4,
            background:
              'radial-gradient(ellipse 60% 100% at 50% 0%, color-mix(in srgb, var(--tech-lightcyan) 14%, transparent), transparent 75%)',
          }}
        />

        {/* 残影气泡：数量减半、省略高光 */}
        <BubbleField
          count={
            isDesktop
              ? HOME_BUBBLE_COUNT_UNDERWATER.desktop
              : HOME_BUBBLE_COUNT_UNDERWATER.mobile
          }
          withHighlight={false}
        />
      </div>
    </div>
  );
}
