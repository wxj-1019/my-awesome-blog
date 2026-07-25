'use client';

import { motion, Variants } from '@/lib/framer-motion';
import { TRANSITION } from '@/lib/animation-utils';
import { ReactNode, isValidElement } from 'react';

export type TransitionType = 'fade' | 'slide' | 'scale' | 'flip' | 'none';

export interface PageTransitionProps {
  children: ReactNode;
  type?: TransitionType;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  delay?: number;
  className?: string;
}

const transitionVariants: Record<TransitionType, Variants> = {
  none: {
    hidden: { opacity: 1 },
    visible: { opacity: 1 },
    exit: { opacity: 1 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: TRANSITION.DEFAULT,
    },
    exit: {
      opacity: 0,
      transition: TRANSITION.FAST,
    },
  },
  slide: {
    // 柔和化：位移从 ±100 降到 ±40，避免大幅度飞入飞出
    hidden: (direction: 'left' | 'right' | 'up' | 'down' = 'right') => ({
      x: direction === 'left' ? -40 : direction === 'right' ? 40 : 0,
      y: direction === 'up' ? -40 : direction === 'down' ? 40 : 0,
      opacity: 0,
    }),
    visible: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: TRANSITION.DEFAULT,
    },
    exit: (direction: 'left' | 'right' | 'up' | 'down' = 'right') => ({
      x: direction === 'left' ? 40 : direction === 'right' ? -40 : 0,
      y: direction === 'up' ? 40 : direction === 'down' ? -40 : 0,
      opacity: 0,
      transition: TRANSITION.FAST,
    }),
  },
  scale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: TRANSITION.DEFAULT,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: TRANSITION.FAST,
    },
  },
  flip: {
    // 柔和化：rotateY ±90° 降到 ±15°，加轻微 scale 补偿，避免页面翻飞感
    hidden: { opacity: 0, rotateY: 15, scale: 0.98 },
    visible: {
      opacity: 1,
      rotateY: 0,
      scale: 1,
      transition: TRANSITION.DEFAULT,
    },
    exit: {
      opacity: 0,
      rotateY: -15,
      scale: 0.98,
      transition: TRANSITION.FAST,
    },
  },
};

export default function PageTransition({
  children,
  type = 'fade',
  direction = 'right',
  // 默认时长取统一预设（DEFAULT 0.48s），保持与全局节奏一致
  duration = TRANSITION.DEFAULT.duration ?? 0.48,
  delay = 0,
  className
}: PageTransitionProps) {
  const variants = transitionVariants[type];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={direction}
      variants={variants}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredChildren({
  children,
  staggerDelay = 0.1,
  className
}: {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: TRANSITION.DEFAULT,
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
    >
      {Array.isArray(children) ? children.map((child, index) => (
        <motion.div
          key={isValidElement(child) ? child.key ?? index : index}
          variants={itemVariants}
        >
          {child}
        </motion.div>
      )) : (
        <motion.div variants={itemVariants}>
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}
