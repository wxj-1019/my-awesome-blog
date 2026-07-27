'use client';

import * as React from 'react';
import { motion, HTMLMotionProps } from '@/lib/framer-motion';
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

/**
 * 变体样式：只消费语义 token。
 * primary 统一走 bg-primary（规范 §7.3：禁止再写 bg-tech-cyan 按钮）；
 * danger 走 destructive；中性态走 secondary / foreground，
 * 这些 token 本身随主题切换，故不再写 dark: 分支。
 */
const variantStyles: Record<ButtonVariant, { base: string; hover: string; active: string; disabled: string }> = {
  primary: {
    base: cn(
      'bg-primary',
      'text-primary-foreground',
      'shadow-tech-cyan',
      'border border-transparent'
    ),
    hover: 'hover:bg-primary/90',
    active: 'active:bg-primary/80 active:scale-[0.98]',
    disabled: 'disabled:bg-primary/50 disabled:cursor-not-allowed',
  },
  secondary: {
    base: cn(
      'bg-secondary',
      'text-secondary-foreground',
      'border border-border',
      'shadow-[var(--glass-shadow)]'
    ),
    hover: 'hover:bg-secondary/80',
    active: 'active:bg-secondary/70 active:scale-[0.98]',
    disabled: 'disabled:bg-secondary/40 disabled:cursor-not-allowed',
  },
  outline: {
    base: cn(
      'bg-transparent',
      'border-2 border-border',
      'text-foreground'
    ),
    hover: 'hover:border-primary hover:text-primary hover:bg-primary/5',
    active: 'active:border-primary active:text-primary active:bg-primary/10 active:scale-[0.98]',
    disabled: 'disabled:border-border/50 disabled:text-muted-foreground disabled:cursor-not-allowed',
  },
  ghost: {
    base: cn(
      'bg-transparent',
      'text-muted-foreground',
      'border border-transparent'
    ),
    hover: 'hover:bg-foreground/5 hover:text-foreground',
    active: 'active:bg-foreground/10 active:scale-[0.98]',
    disabled: 'disabled:text-muted-foreground/50 disabled:cursor-not-allowed',
  },
  danger: {
    base: cn(
      'bg-destructive',
      'text-destructive-foreground',
      'shadow-lg shadow-destructive/20',
      'border border-transparent'
    ),
    hover: 'hover:bg-destructive/90 hover:shadow-xl hover:shadow-destructive/30',
    active: 'active:bg-destructive/80 active:scale-[0.98]',
    disabled: 'disabled:bg-destructive/40 disabled:cursor-not-allowed',
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
          'transition-colors duration-200 ease-out',
          'cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
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
              'border border-border',
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
