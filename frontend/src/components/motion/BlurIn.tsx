'use client';

import { motion } from '@/lib/framer-motion';
import type { ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE, TRANSITION } from '@/lib/animation-utils';
import { cn } from '@/lib/utils';

interface BlurInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  blur?: number;
  once?: boolean;
}

/**
 * L1：BlurIn（veloce 模式，保留 cyan glass 气质）
 */
export default function BlurIn({
  children,
  className,
  delay = 0,
  duration,
  blur = 5,
  once = true,
}: BlurInProps) {
  const reduced = useReducedMotion();
  const animDuration = duration ?? TRANSITION.DEFAULT.duration ?? 0.48;

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, filter: `blur(${blur}px)`, y: 8 }}
      whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      viewport={{ once, margin: '-40px' }}
      transition={{ duration: animDuration, delay, ease: EASE.SMOOTH }}
      style={{ willChange: 'transform, opacity, filter' }}
    >
      {children}
    </motion.div>
  );
}
