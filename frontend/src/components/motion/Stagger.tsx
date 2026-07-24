'use client';

import { motion, type Variants } from '@/lib/framer-motion';
import type { ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE, STAGGER, staggerContainer, staggerItem } from '@/lib/animation-utils';
import { MAX_STAGGER_ITEMS } from '@/lib/gsap/scroll-presets';
import { cn } from '@/lib/utils';

interface StaggerProps {
  children: ReactNode;
  className?: string;
  /** 子项间隔（秒），默认 0.08 */
  stagger?: number;
  delay?: number;
  once?: boolean;
  /** 子项数量提示：>20 时自动关闭 stagger */
  itemCount?: number;
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

const itemVariants: Variants = {
  ...staggerItem,
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: EASE.SMOOTH },
  },
};

/**
 * L1：交错容器（veloce Insights 模式）
 */
export function Stagger({
  children,
  className,
  stagger = STAGGER.DEFAULT,
  delay = 0,
  once = true,
  itemCount,
}: StaggerProps) {
  const reduced = useReducedMotion();
  const disableStagger =
    reduced || (typeof itemCount === 'number' && itemCount > MAX_STAGGER_ITEMS);

  if (disableStagger) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      variants={staggerContainer(stagger, delay)}
      initial="hidden"
      // 首屏列表用 whileInView 时，负 margin 可能让已在视口内的网格迟迟不进 visible，
      // 子项会一直停在 opacity:0。amount:0 表示「一露出就播」。
      whileInView="visible"
      viewport={{ once, amount: 0 }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

export default Stagger;
