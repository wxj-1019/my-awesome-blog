'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE, TRANSITION } from '@/lib/animation-utils';
import { cn } from '@/lib/utils';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: Direction;
  once?: boolean;
  as?: 'div' | 'section' | 'article' | 'span';
}

const offset: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 20 },
  down: { y: -20 },
  left: { x: 20 },
  right: { x: -20 },
  none: {},
};

/**
 * L1：淡入 + 可选位移（Framer Motion only）
 */
export default function FadeIn({
  children,
  className,
  delay = 0,
  duration,
  direction = 'up',
  once = true,
  as = 'div',
}: FadeInProps) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as];
  const animDuration = duration ?? TRANSITION.DEFAULT.duration ?? 0.6;

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <MotionTag
      className={cn(className)}
      initial={{ opacity: 0, ...offset[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: '-40px' }}
      transition={{ duration: animDuration, delay, ease: EASE.APPLE }}
      style={{ willChange: 'transform, opacity', backfaceVisibility: 'hidden' }}
    >
      {children}
    </MotionTag>
  );
}
