'use client';

import { cn } from '@/lib/utils';

/**
 * 片头 → 水下展厅：消除 Hero 与内容区的硬切。
 * 纯装饰，不拦截指针。
 */
export default function DiveTransition({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative pointer-events-none -mt-6 sm:-mt-10 z-10',
        className
      )}
      aria-hidden
    >
      {/* 入水色带：自上透明落入 background */}
      <div
        className={cn(
          'h-24 sm:h-32 w-full',
          'bg-gradient-to-b',
          'from-transparent via-primary/[0.06] to-background'
        )}
      />
      {/* 薄雾水平线：像水面折射 */}
      <div
        className={cn(
          'absolute inset-x-0 top-1/3 h-px',
          'bg-gradient-to-r from-transparent via-primary/25 to-transparent'
        )}
      />
      <div
        className={cn(
          'absolute inset-x-[10%] top-[45%] h-8 blur-2xl',
          'bg-primary/10 rounded-full'
        )}
      />
    </div>
  );
}
