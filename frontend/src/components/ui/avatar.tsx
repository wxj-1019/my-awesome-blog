import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'default' | 'neon' | 'glass'
  }
>(({ className, size = 'md', variant = 'default', ...props }, ref) => {
  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const variantStyles = {
    default: 'bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600',
    neon: 'bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]',
    glass: 'bg-glass/30 backdrop-blur-xl border border-glass-border'
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden transition-transform duration-300',
        'hover:scale-105',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
});
Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'alt' | 'src' | 'width' | 'height'> & {
    src: string
    alt: string
    onLoadingStatusChange?: (status: 'loading' | 'loaded' | 'error') => void
  }
>(({ className, alt, onLoad, onError, onLoadingStatusChange, ...props }, ref) => {
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    onLoadingStatusChange?.('loaded');
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    onLoadingStatusChange?.('error');
    onError?.(e);
  };

  return (
    <Image
      ref={ref}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, 33vw"
      className={cn('aspect-square object-cover', className)}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
});
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full font-semibold',
        'text-white/90 bg-gradient-to-br from-slate-600/80 to-slate-800/80',
        'backdrop-blur-sm',
        className
      )}
      {...props}
    >
      {typeof children === 'string' && children.length > 0
        ? children.slice(0, 2).toUpperCase()
        : children}
    </div>
  );
});
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
