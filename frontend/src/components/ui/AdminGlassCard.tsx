'use client';

import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface GlassCardAdminProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  hoverEffect?: boolean;
  glowEffect?: boolean;
  clickable?: boolean;
  loading?: boolean;
  className?: string;
  animationDelay?: number;
  onAnimationComplete?: () => void;
}

const GlassCardAdmin = React.forwardRef<HTMLDivElement, GlassCardAdminProps>(
  ({ 
    children, 
    variant = 'primary', 
    hoverEffect = true, 
    glowEffect = true,
    clickable = false,
    loading = false,
    className, 
    animationDelay = 0,
    onAnimationComplete,
    onClick,
    ...props 
  }, ref) => {
    
    const [isHovered, setIsHovered] = React.useState(false);
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

    const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }, []);

    const variantClasses = {
      primary: {
        bg: 'bg-white/50 dark:bg-slate-800/40',
        backdrop: 'backdrop-blur-xl',
        border: 'border-slate-200/50 dark:border-slate-700/50',
        shadow: 'shadow-lg',
        hoverBorder: 'hover:border-tech-cyan/30 dark:hover:border-tech-cyan/20',
        hoverShadow: 'hover:shadow-tech-cyan/10',
      },
      secondary: {
        bg: 'bg-white/30 dark:bg-slate-800/30',
        backdrop: 'backdrop-blur-lg',
        border: 'border-slate-200/40 dark:border-slate-700/40',
        shadow: 'shadow-md',
        hoverBorder: 'hover:border-slate-300/50 dark:hover:border-slate-600/50',
        hoverShadow: 'hover:shadow-lg',
      },
      accent: {
        bg: 'bg-gradient-to-br from-blue-500/15 to-cyan-500/15 dark:from-blue-500/20 dark:to-cyan-500/20',
        backdrop: 'backdrop-blur-xl',
        border: 'border-blue-500/30 dark:border-cyan-500/30',
        shadow: 'shadow-lg',
        hoverBorder: 'hover:border-blue-500/50 dark:hover:border-cyan-500/50',
        hoverShadow: 'hover:shadow-blue-500/20',
      },
      success: {
        bg: 'bg-green-50/50 dark:bg-green-900/20',
        backdrop: 'backdrop-blur-xl',
        border: 'border-green-200/50 dark:border-green-800/50',
        shadow: 'shadow-lg',
        hoverBorder: 'hover:border-green-500/30',
        hoverShadow: 'hover:shadow-green-500/10',
      },
      warning: {
        bg: 'bg-yellow-50/50 dark:bg-yellow-900/20',
        backdrop: 'backdrop-blur-xl',
        border: 'border-yellow-200/50 dark:border-yellow-800/50',
        shadow: 'shadow-lg',
        hoverBorder: 'hover:border-yellow-500/30',
        hoverShadow: 'hover:shadow-yellow-500/10',
      },
      error: {
        bg: 'bg-red-50/50 dark:bg-red-900/20',
        backdrop: 'backdrop-blur-xl',
        border: 'border-red-200/50 dark:border-red-800/50',
        shadow: 'shadow-lg',
        hoverBorder: 'hover:border-red-500/30',
        hoverShadow: 'hover:shadow-red-500/10',
      },
    };

    const currentVariant = variantClasses[variant];

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-2xl border overflow-hidden relative',
          currentVariant.bg,
          currentVariant.backdrop,
          currentVariant.border,
          currentVariant.shadow,
          hoverEffect && 'transition-all duration-300 ease-out',
          hoverEffect && 'hover:-translate-y-1',
          hoverEffect && currentVariant.hoverBorder,
          hoverEffect && currentVariant.hoverShadow,
          clickable && 'cursor-pointer active:scale-98',
          glowEffect && 'hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] dark:hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
          loading && 'opacity-70 pointer-events-none',
          className
        )}
        style={{
          animationDelay: `${animationDelay}ms`,
          animationFillMode: 'both',
        }}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ 
          duration: 0.4, 
          ease: [0.25, 0.1, 0.25, 1],
          delay: animationDelay / 1000 
        }}
        onAnimationComplete={onAnimationComplete}
        onMouseMove={hoverEffect ? handleMouseMove : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        {...props}
      >
        <div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          }}
        />

        {isHovered && glowEffect && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 pointer-events-none"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm z-10">
            <motion.div
              className="relative w-10 h-10"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <div className="absolute inset-0 border-4 border-tech-cyan/30 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-tech-cyan rounded-full" />
            </motion.div>
          </div>
        )}

        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);

GlassCardAdmin.displayName = 'GlassCardAdmin';

export default GlassCardAdmin;