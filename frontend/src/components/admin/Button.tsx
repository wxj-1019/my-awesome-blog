'use client';

import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
}

const sizeConfig: Record<ButtonSize, { padding: string; text: string; icon: string }> = {
  sm: { padding: 'px-3 py-1.5', text: 'text-sm', icon: 'w-4 h-4' },
  md: { padding: 'px-5 py-2.5', text: 'text-base', icon: 'w-5 h-5' },
  lg: { padding: 'px-6 py-3', text: 'text-lg', icon: 'w-6 h-6' },
};

const variantStyles: Record<ButtonVariant, { base: string; hover: string; active: string; disabled: string }> = {
  primary: {
    base: cn(
      'bg-gradient-to-r from-tech-cyan to-tech-sky',
      'text-white dark:text-gray-100',
      'shadow-lg shadow-tech-cyan/20',
      'hover:shadow-xl hover:shadow-tech-cyan/30',
      'border border-transparent'
    ),
    hover: 'hover:from-tech-cyan/90 hover:to-tech-sky/90',
    active: 'active:from-tech-cyan/80 active:to-tech-sky/80 active:scale-[0.98]',
    disabled: 'disabled:from-tech-cyan/50 disabled:to-tech-sky/50 disabled:cursor-not-allowed',
  },
  secondary: {
    base: cn(
      'bg-slate-100 dark:bg-slate-700/80',
      'text-slate-900 dark:text-slate-100',
      'border border-slate-200 dark:border-slate-600',
      'shadow-md shadow-slate-200/20 dark:shadow-black/20'
    ),
    hover: 'hover:bg-slate-200 dark:hover:bg-slate-600',
    active: 'active:bg-slate-300 dark:active:bg-slate-500 active:scale-[0.98]',
    disabled: 'disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed',
  },
  outline: {
    base: cn(
      'bg-transparent',
      'border-2 border-slate-300 dark:border-slate-600',
      'text-slate-700 dark:text-slate-300'
    ),
    hover: 'hover:border-tech-cyan hover:text-tech-cyan hover:bg-tech-cyan/5',
    active: 'active:border-tech-cyan active:text-tech-cyan active:bg-tech-cyan/10 active:scale-[0.98]',
    disabled: 'disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed',
  },
  ghost: {
    base: cn(
      'bg-transparent',
      'text-slate-700 dark:text-slate-300',
      'border border-transparent'
    ),
    hover: 'hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100',
    active: 'active:bg-slate-200 dark:active:bg-slate-600 active:scale-[0.98]',
    disabled: 'disabled:text-slate-400 disabled:cursor-not-allowed',
  },
  danger: {
    base: cn(
      'bg-gradient-to-r from-red-500 to-red-600',
      'text-white',
      'shadow-lg shadow-red-500/20',
      'border border-transparent'
    ),
    hover: 'hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/30',
    active: 'active:from-red-700 active:to-red-800 active:scale-[0.98]',
    disabled: 'disabled:from-red-300 disabled:to-red-400 disabled:cursor-not-allowed',
  },
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    disabled = false, 
    leftIcon: LeftIcon, 
    rightIcon: RightIcon, 
    fullWidth = false,
    children, 
    ...props 
  }, ref) => {
    const sizeStyles = sizeConfig[size];
    const variantStyle = variantStyles[variant];
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          'rounded-xl font-semibold',
          'transition-all duration-200 ease-out',
          'cursor-pointer',
          'min-h-[48px]',
          sizeStyles.padding,
          sizeStyles.text,
          variantStyle.base,
          !isDisabled && variantStyle.hover,
          !isDisabled && variantStyle.active,
          isDisabled && variantStyle.disabled,
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        whileHover={!isDisabled ? { scale: 1.02 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {loading ? (
          <Loader2 className={cn('animate-spin', sizeStyles.icon)} />
        ) : (
          <>
            {LeftIcon && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <LeftIcon className={sizeStyles.icon} />
              </motion.span>
            )}
            <span className={cn(loading && 'opacity-0')}>{children}</span>
            {RightIcon && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <RightIcon className={sizeStyles.icon} />
              </motion.span>
            )}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export const ButtonGroup = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return (
            <div className={cn(
              'first:rounded-l-xl last:rounded-r-xl',
              'border border-slate-200 dark:border-slate-700',
              'hover:z-10 focus:z-20'
            )}>
              {React.cloneElement(child as React.ReactElement<ButtonProps>, {
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
