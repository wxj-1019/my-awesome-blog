'use client';

import { motion, useInView, Variants } from '@/lib/framer-motion';
import { useRef, ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  once?: boolean;
  threshold?: number;
}

export default function AnimatedSection({
  children,
  className = '',
  delay = 0,
  duration = 0.6,
  direction = 'up',
  distance = 40,
  once = true,
  threshold = 0.2,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: threshold });
  // 减少动画偏好：跳过入场位移，直接呈现终态
  const reducedMotion = useReducedMotion();

  const getInitialPosition = () => {
    if (reducedMotion) {return { x: 0, y: 0 };}
    switch (direction) {
      case 'up':
        return { y: distance, x: 0 };
      case 'down':
        return { y: -distance, x: 0 };
      case 'left':
        return { x: distance, y: 0 };
      case 'right':
        return { x: -distance, y: 0 };
      case 'none':
        return { x: 0, y: 0 };
      default:
        return { y: distance, x: 0 };
    }
  };

  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...getInitialPosition(),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: reducedMotion ? 0 : duration,
        delay: reducedMotion ? 0 : delay,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger Container for lists
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
  threshold?: number;
}

export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.08,
  once = true,
  threshold = 0.1,
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: threshold });
  // 减少动画偏好：跳过交错入场
  const reducedMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: reducedMotion
        ? { duration: 0 }
        : {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger Item for use inside StaggerContainer
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
}

export function StaggerItem({
  children,
  className = '',
  direction = 'up',
  distance = 30,
}: StaggerItemProps) {
  // 减少动画偏好：跳过入场位移
  const reducedMotion = useReducedMotion();

  const getInitialPosition = () => {
    if (reducedMotion) {return { x: 0, y: 0 };}
    switch (direction) {
      case 'up':
        return { y: distance, x: 0 };
      case 'down':
        return { y: -distance, x: 0 };
      case 'left':
        return { x: distance, y: 0 };
      case 'right':
        return { x: -distance, y: 0 };
      default:
        return { y: distance, x: 0 };
    }
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      ...getInitialPosition(),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: reducedMotion ? 0 : 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// Page load animation wrapper
interface PageLoadAnimationProps {
  children: ReactNode;
  className?: string;
}

export function PageLoadAnimation({ children, className = '' }: PageLoadAnimationProps) {
  // 减少动画偏好：页面加载淡入回退为瞬时呈现
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.5, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
