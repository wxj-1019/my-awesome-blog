'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FriendLinkCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
  glowEffect?: boolean;
  className?: string;
  cornerAnimation?: boolean;
}

const FriendLinkCard = React.forwardRef<HTMLDivElement, FriendLinkCardProps>(
  ({
    children,
    padding = 'md',
    hoverEffect = false,
    glowEffect = false,
    className,
    cornerAnimation = false,
    ...props
  }, ref) => {
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
          'relative rounded-xl border border-glass-border shadow-lg text-foreground transition-[colors,transform] duration-300 overflow-hidden',
          'bg-glass backdrop-blur-xl',
          hoverEffect && 'hover:-translate-y-1 hover:shadow-2xl hover:border-glass-glow',
          glowEffect && 'hover:shadow-[0_0_30px_var(--shadow-tech-cyan)]',
          cornerAnimation && 'friend-link-corner',
          className
        )}
        {...props}
      >
        <div className={cn('z-10 pointer-events-none', paddingClasses[padding])}>
          {children}
        </div>
      </div>
    );
  }
);

FriendLinkCard.displayName = 'FriendLinkCard';

export default FriendLinkCard;