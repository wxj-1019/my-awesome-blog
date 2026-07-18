'use client';

import { motion, Variants } from '@/lib/framer-motion';
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
      transition: { duration: 0.4, ease: 'easeInOut' },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
  },
  slide: {
    hidden: (direction: 'left' | 'right' | 'up' | 'down' = 'right') => ({
      x: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
      y: direction === 'up' ? -100 : direction === 'down' ? 100 : 0,
      opacity: 0,
    }),
    visible: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
    },
    exit: (direction: 'left' | 'right' | 'up' | 'down' = 'right') => ({
      x: direction === 'left' ? 100 : direction === 'right' ? -100 : 0,
      y: direction === 'up' ? 100 : direction === 'down' ? -100 : 0,
      opacity: 0,
      transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
    }),
  },
  scale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
    },
  },
  flip: {
    hidden: { opacity: 0, rotateY: 90 },
    visible: {
      opacity: 1,
      rotateY: 0,
      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
    },
    exit: {
      opacity: 0,
      rotateY: -90,
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
    },
  },
};

export default function PageTransition({
  children,
  type = 'fade',
  direction = 'right',
  duration = 0.4,
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
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
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
