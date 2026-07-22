'use client';

import * as React from 'react';
import { motion } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import LottieAnimation from '@/components/ui/LottieAnimation';

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  /**
   * ripple：深海声呐涟漪（Lottie，默认推荐）；
   * spinner/dots/pulse：纯 CSS 旧变体，保留兼容
   */
  variant?: 'ripple' | 'spinner' | 'dots' | 'pulse';
  className?: string;
}

const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ message, size = 'md', variant = 'ripple', className }, ref) => {
    // 循环动画（spinner/dots/pulse）需 prefers-reduced-motion 回退为静态
    const reducedMotion = useReducedMotion();

    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
    };

    /** Lottie 涟漪尺寸（比 CSS 圈略大，观感才舒展） */
    const rippleSizeClasses = {
      sm: 'w-14 h-14',
      md: 'w-24 h-24',
      lg: 'w-32 h-32',
    };

    const containerSizeClasses = {
      sm: 'min-h-[100px]',
      md: 'min-h-[200px]',
      lg: 'min-h-[300px]',
    };

    // 入场动效：reduced-motion 时跳过，直接渲染静态终态
    const entranceProps = (delay = 0) =>
      reducedMotion
        ? {}
        : {
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 },
            transition: { delay, duration: 0.4 },
          };

    const messageNode = message ? (
      <motion.p
        className="mt-4 text-sm text-foreground/60"
        {...entranceProps(0.2)}
      >
        {message}
      </motion.p>
    ) : null;

    if (variant === 'ripple') {
      return (
        <div
          ref={ref}
          className={cn(
            'flex flex-col items-center justify-center',
            containerSizeClasses[size],
            className
          )}
        >
          {/* 深海声呐涟漪：本地 Lottie；失败/reduced-motion 回退 CSS 静态圈 */}
          <LottieAnimation
            src="/lottie/ripple-sonar.json"
            className={rippleSizeClasses[size]}
            staticOnReduceMotion
            fallback={
              <div
                className={cn(
                  'border-4 border-tech-cyan/30 border-t-tech-cyan rounded-full',
                  sizeClasses[size]
                )}
              />
            }
          />
          {messageNode}
        </div>
      );
    }

    if (variant === 'spinner') {
      return (
        <div
          ref={ref}
          className={cn(
            'flex flex-col items-center justify-center',
            containerSizeClasses[size],
            className
          )}
        >
          <motion.div
            className={cn('relative', sizeClasses[size])}
            {...(reducedMotion
              ? {}
              : {
                  initial: { opacity: 0, scale: 0.8 },
                  animate: { opacity: 1, scale: 1 },
                  transition: { duration: 0.5 },
                })}
          >
            {/* 旋转圈：reduced-motion 时静止为静态圈 */}
            <div className={cn(
              'border-4 border-tech-cyan/30 border-t-tech-cyan rounded-full',
              !reducedMotion && 'animate-spin',
              sizeClasses[size]
            )} />
            <div
              className={cn(
                'absolute inset-0 border-4 border-tech-sky/20 border-t-tech-sky rounded-full',
                !reducedMotion && 'animate-spin',
                sizeClasses[size]
              )}
              style={{ animationDuration: '1.5s' }}
            />
          </motion.div>
          {messageNode}
        </div>
      );
    }

    if (variant === 'dots') {
      return (
        <div
          ref={ref}
          className={cn(
            'flex flex-col items-center justify-center',
            containerSizeClasses[size],
            className
          )}
        >
          <div className="flex gap-2">
            {/* 加载动画点：列表固定不变，使用 index 作为 key；reduced-motion 时为静态点 */}
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className={cn(
                  'rounded-full bg-tech-cyan',
                  size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
                )}
                {...(reducedMotion
                  ? {}
                  : {
                      initial: { opacity: 0, scale: 0.8 },
                      animate: { opacity: 1, scale: 1 },
                      transition: {
                        duration: 0.5,
                        delay: index * 0.1,
                        repeat: Infinity,
                        repeatType: 'reverse',
                      },
                    })}
              />
            ))}
          </div>
          {messageNode}
        </div>
      );
    }

    if (variant === 'pulse') {
      return (
        <div
          ref={ref}
          className={cn(
            'flex flex-col items-center justify-center',
            containerSizeClasses[size],
            className
          )}
        >
          {/* 脉冲圆：reduced-motion 时静止 */}
          <motion.div
            className={cn(
              'rounded-full bg-gradient-to-br from-tech-cyan to-tech-sky',
              sizeClasses[size]
            )}
            {...(reducedMotion
              ? {}
              : {
                  initial: { opacity: 0, scale: 0.8 },
                  animate: { opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] },
                  transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                })}
          />
          {messageNode}
        </div>
      );
    }

    return null;
  }
);

LoadingState.displayName = 'LoadingState';

export default LoadingState;
