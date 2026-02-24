'use client';

import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2, Check, ArrowRight, Plus, Download, Share2 } from 'lucide-react';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  success?: boolean;
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
  glowEffect?: boolean;
  ripple?: boolean;
  animationDelay?: number;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    success = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    fullWidth = false,
    glowEffect = true,
    ripple = true,
    animationDelay = 0,
    className,
    disabled,
    onClick,
    ...props
  }, ref) => {
    const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([]);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    React.useImperativeHandle(ref, () => buttonRef.current!);

    const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!ripple || loading || disabled) {
        return;
      }

      const button = buttonRef.current;
      if (!button) {
        return;
      }

      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const id = Date.now();
      setRipples((prev) => [...prev, { id, x, y }]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      handleRipple(e);
      onClick?.(e);
    };

    const sizeClasses = {
      xs: {
        padding: 'px-2.5 py-1.5',
        text: 'text-xs',
        icon: 'w-3 h-3',
      },
      sm: {
        padding: 'px-3 py-2',
        text: 'text-sm',
        icon: 'w-4 h-4',
      },
      md: {
        padding: 'px-4 py-2.5',
        text: 'text-sm',
        icon: 'w-4 h-4',
      },
      lg: {
        padding: 'px-5 py-3',
        text: 'text-base',
        icon: 'w-5 h-5',
      },
      xl: {
        padding: 'px-6 py-4',
        text: 'text-lg',
        icon: 'w-6 h-6',
      },
    };

    const currentSize = sizeClasses[size];

    const variantClasses = {
      primary: {
        base: 'bg-tech-cyan text-white',
        hover: 'hover:bg-tech-cyan/90',
        active: 'active:bg-tech-cyan/80',
        shadow: 'shadow-lg shadow-tech-cyan/20',
        hoverShadow: 'hover:shadow-tech-cyan/30',
      },
      secondary: {
        base: 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100',
        hover: 'hover:bg-slate-200 dark:hover:bg-slate-600',
        active: 'active:bg-slate-300 dark:active:bg-slate-500',
        shadow: 'shadow-md',
        hoverShadow: 'hover:shadow-lg',
      },
      outline: {
        base: 'bg-transparent border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300',
        hover: 'hover:border-tech-cyan hover:text-tech-cyan dark:hover:border-tech-cyan',
        active: 'active:border-tech-cyan/80 active:text-tech-cyan/80',
        shadow: 'shadow-sm',
        hoverShadow: 'hover:shadow-md',
      },
      ghost: {
        base: 'bg-transparent text-slate-700 dark:text-slate-300',
        hover: 'hover:bg-slate-100 dark:hover:bg-slate-700',
        active: 'active:bg-slate-200 dark:active:bg-slate-600',
        shadow: 'shadow-none',
        hoverShadow: 'hover:shadow-sm',
      },
      danger: {
        base: 'bg-red-500 text-white',
        hover: 'hover:bg-red-600',
        active: 'active:bg-red-700',
        shadow: 'shadow-lg shadow-red-500/20',
        hoverShadow: 'hover:shadow-red-500/30',
      },
      success: {
        base: 'bg-green-500 text-white',
        hover: 'hover:bg-green-600',
        active: 'active:bg-green-700',
        shadow: 'shadow-lg shadow-green-500/20',
        hoverShadow: 'hover:shadow-green-500/30',
      },
      warning: {
        base: 'bg-yellow-500 text-white',
        hover: 'hover:bg-yellow-600',
        active: 'active:bg-yellow-700',
        shadow: 'shadow-lg shadow-yellow-500/20',
        hoverShadow: 'hover:shadow-yellow-500/30',
      },
    };

    const currentVariant = variantClasses[variant];

    return (
      <motion.button
        ref={buttonRef}
        type="button"
        disabled={disabled || loading}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 font-medium rounded-xl',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-tech-cyan focus:ring-offset-2 focus:ring-offset-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'overflow-hidden',
          currentVariant.base,
          currentVariant.hover,
          currentVariant.active,
          currentVariant.shadow,
          currentVariant.hoverShadow,
          currentSize.padding,
          currentSize.text,
          glowEffect && 'hover:shadow-2xl',
          fullWidth && 'w-full',
          success && 'bg-green-500 hover:bg-green-600',
          className
        )}
        onClick={handleClick}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: animationDelay / 1000, duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
            }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <span className="block w-20 h-20 rounded-full bg-white/30" />
          </motion.span>
        ))}

        {loading && (
          <motion.div
            className={currentSize.icon}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className={currentSize.icon} />
          </motion.div>
        )}

        {success && !loading && (
          <motion.div
            className={currentSize.icon}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <Check className={currentSize.icon} />
          </motion.div>
        )}

        {!loading && !success && LeftIcon && (
          <motion.div
            className={currentSize.icon}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <LeftIcon className={currentSize.icon} />
          </motion.div>
        )}

        <span className={cn(loading && 'opacity-0', success && 'opacity-0')}>
          {children}
        </span>

        {!loading && !success && RightIcon && (
          <motion.div
            className={currentSize.icon}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <RightIcon className={currentSize.icon} />
          </motion.div>
        )}

        {glowEffect && !disabled && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6 }}
          />
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export const ButtonGroup = ({ children, className }: { children: React.ReactNode; className?: string }): React.ReactNode => {
  return (
    <div className={cn('inline-flex items-center -space-x-1', className)}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return (
            <div
              className={cn(
                'first:rounded-l-xl last:rounded-r-xl',
                'border border-slate-200 dark:border-slate-700',
                'hover:z-10 focus:z-20'
              )}
            >
              {React.cloneElement(child as any, {
                className: cn('rounded-none', child.props.className),
              })}
            </div>
          );
        }
        return child;
      })}
    </div>
  );
};

export default Button;
