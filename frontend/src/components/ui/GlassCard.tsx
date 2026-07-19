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
          'rounded-xl border shadow-lg transition-all duration-300',
          'backdrop-blur-xl',
          'bg-glass border-glass-border text-foreground',
          'shadow-[var(--glass-shadow)]',
          paddingClasses[padding],
          hoverEffect &&
            'hover:-translate-y-1 hover:shadow-2xl hover:border-primary/40 cursor-pointer',
          glowEffect && 'hover:shadow-[0_0_30px_var(--shadow-tech-cyan)]',
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
