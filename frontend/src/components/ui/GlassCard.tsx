'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/theme-context';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
  glowEffect?: boolean;
  className?: string;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, padding = 'md', hoverEffect = false, glowEffect = false, className, ...props }, ref) => {
    const { resolvedTheme } = useTheme();
    
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };
    
    const isLight = resolvedTheme === 'light';
    
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border shadow-lg transition-all duration-300',
          'backdrop-blur-xl',
          paddingClasses[padding],
          isLight ? [
            'bg-glass',
            'border-glass-border',
            'text-foreground',
            'shadow-glass',
            hoverEffect && 'hover:shadow-xl hover:-translate-y-1 hover:border-tech-cyan/30 cursor-pointer',
            glowEffect && 'hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]',
          ] : [
            'bg-glass',
            'border-glass-border',
            'text-foreground',
            hoverEffect && 'hover:-translate-y-1 hover:shadow-2xl hover:border-glass-glow cursor-pointer',
            glowEffect && 'hover:shadow-[0_0_30px_var(--shadow-tech-cyan)]',
          ],
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
