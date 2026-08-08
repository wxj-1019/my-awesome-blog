'use client';

import { cn } from '@/lib/utils';

/**
 * 片头 → 第一幕：薄渐变色带过渡。
 *
 * 从 Hero 的视频色调平滑过渡到页面背景，消除硬切。
 * 仅静态三层渐变（水面折射 → 水体 → 水下定调），无 GSAP/光柱/气泡。
 * 负 margin 向上吃进 Hero 底部波浪层，实现无缝衔接。
 */
export default function DiveTransition({ className }: { className?: string }) {
  return (
    <div
      data-dive-root
      className={cn('relative pointer-events-none -mt-6 sm:-mt-10 z-10 h-24 sm:h-32', className)}
      aria-hidden
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
      {/* 色带 · 下：水下定调（深水蓝收进背景） */}
      <div
        data-dive-band="deep"
        className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-b from-tech-deepblue/45 via-tech-deepblue/28 to-background"
      />
    </div>
  );
}
