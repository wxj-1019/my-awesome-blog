'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  className?: string;
}

const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ message, size = 'md', variant = 'spinner', className }, ref) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
    };

    const containerSizeClasses = {
      sm: 'min-h-[100px]',
      md: 'min-h-[200px]',
      lg: 'min-h-[300px]',
    };

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
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className={cn(
              'border-4 border-tech-cyan/30 border-t-tech-cyan rounded-full animate-spin',
              sizeClasses[size]
            )} />
            <div
              className={cn(
                'absolute inset-0 border-4 border-tech-sky/20 border-t-tech-sky rounded-full animate-spin',
                sizeClasses[size]
              )}
              style={{ animationDuration: '1.5s' }}
            />
          </motion.div>
          {message && (
            <motion.p
              className="mt-4 text-sm text-foreground/60"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {message}
            </motion.p>
          )}
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
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className={cn(
                  'rounded-full bg-tech-cyan',
                  size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
                )}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              />
            ))}
          </div>
          {message && (
            <motion.p
              className="mt-4 text-sm text-foreground/60"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {message}
            </motion.p>
          )}
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
          <motion.div
            className={cn(
              'rounded-full bg-gradient-to-br from-tech-cyan to-tech-sky',
              sizeClasses[size]
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          {message && (
            <motion.p
              className="mt-4 text-sm text-foreground/60"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {message}
            </motion.p>
          )}
        </div>
      );
    }

    return null;
  }
);

LoadingState.displayName = 'LoadingState';

export default LoadingState;
