'use client';

import { motion, Variants, Transition, TargetAndTransition, VariantLabels } from 'framer-motion';
import { useReducedMotion, useAnimationConfig } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface OptimizedMotionProps {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  initial?: boolean | TargetAndTransition | VariantLabels;
  animate?: boolean | TargetAndTransition | VariantLabels;
  exit?: boolean | TargetAndTransition | VariantLabels;
  transition?: Transition;
  whileHover?: TargetAndTransition;
  whileTap?: TargetAndTransition;
  whileInView?: TargetAndTransition;
  viewport?: { once?: boolean; amount?: number | 'some' | 'all' };
  onClick?: () => void;
}

/**
 * 性能优化的 Motion 组件
 * 自动处理 reduced-motion 偏好
 */
export default function OptimizedMotion({
  children,
  className,
  variants,
  initial,
  animate,
  exit,
  transition,
  whileHover,
  whileTap,
  whileInView,
  viewport,
  onClick
}: OptimizedMotionProps) {
  const reducedMotion = useReducedMotion();
  const config = useAnimationConfig();

  // 如果用户偏好减少动画，简化动画
  if (reducedMotion) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: config.fadeDuration }}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial={initial}
      animate={animate}
      exit={exit as never}
      transition={{
        ...transition,
        // 使用 GPU 加速的缓动函数
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={whileHover}
      whileTap={whileTap}
      whileInView={whileInView}
      viewport={viewport}
      onClick={onClick}
      // 优化渲染
      style={{
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden'
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * 优化的淡入动画
 */
export function FadeIn({
  children,
  className,
  delay = 0,
  duration,
  direction = 'up'
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}) {
  const reducedMotion = useReducedMotion();
  const config = useAnimationConfig();

  const directionOffset = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
    none: {}
  };

  const animDuration = duration ?? config.fadeDuration;

  if (reducedMotion) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: animDuration, delay }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...directionOffset[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration: animDuration,
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      style={{
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden'
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * 优化的缩放动画
 */
export function ScaleIn({
  children,
  className,
  delay = 0
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reducedMotion = useReducedMotion();
  const config = useAnimationConfig();

  if (reducedMotion) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: config.fadeDuration, delay }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: config.scaleDuration,
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      style={{
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden'
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * 优化的悬停效果
 */
export function HoverScale({
  children,
  className,
  scale = 1.02
}: {
  children: ReactNode;
  className?: string;
  scale?: number;
}) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.div>
  );
}

/**
 * 优化的列表项动画
 * 用于虚拟滚动列表
 */
export function ListItem({
  children,
  className,
  index = 0
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  const reducedMotion = useReducedMotion();
  const config = useAnimationConfig();

  // 限制列表动画的 stagger 延迟，避免性能问题
  const staggerDelay = Math.min(index * 0.03, 0.3);

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: config.fadeDuration,
        delay: staggerDelay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      style={{
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden'
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * 脉冲动画（用于状态指示器）
 */
export function Pulse({
  children,
  className,
  color = 'tech-cyan'
}: {
  children: ReactNode;
  className?: string;
  color?: string;
}) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{
        boxShadow: [
          `0 0 0 0 ${color}40`,
          `0 0 0 10px ${color}00`,
          `0 0 0 0 ${color}00`
        ]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * 骨架屏动画
 */
export function Skeleton({
  className,
  count = 1
}: {
  className?: string;
  count?: number;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-slate-800/50 rounded',
            reducedMotion ? '' : 'animate-pulse',
            className
          )}
        />
      ))}
    </>
  );
}
