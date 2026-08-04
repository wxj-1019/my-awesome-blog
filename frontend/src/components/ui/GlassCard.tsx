'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
  glowEffect?: boolean;
  className?: string;
}

/**
 * 玻璃卡片：只消费语义 token（bg-glass / border-glass-border / text-foreground）
 * 不再按 light/dark 分支硬编码，便于后续换肤只改 CSS 变量。
 */
const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      children,
      padding = 'md',
      hoverEffect = false,
      glowEffect = false,
      className,
      ...props
    },
    ref
  ) => {
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          /* 明确属性白名单，时长对齐 TRANSITION.FAST（0.28s） */
          'rounded-xl border shadow-lg transition-[transform,box-shadow,border-color] duration-[280ms]',
          /* 略加强模糊，配合更高不透明度，复杂背景下更易读 */
          'backdrop-blur-md',
          'bg-glass border-glass-border text-foreground',
          'shadow-[var(--glass-shadow)]',
          paddingClasses[padding],
          hoverEffect &&
            'hover:-translate-y-1 hover:shadow-[var(--glass-shadow)] hover:border-primary/40 cursor-pointer',
          /* 柔和玻璃光晕：改用 token 化 15px 轻发光，取代 30px 重发光 */
          glowEffect && 'hover:shadow-tech-cyan',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
