'use client';

import { motion } from '@/lib/framer-motion';
import type { ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { hover } from '@/lib/animation-utils';
import { cn } from '@/lib/utils';

interface HoverLiftProps {
  children: ReactNode;
  className?: string;
  /** 使用卡片级上浮（更大阴影） */
  strong?: boolean;
}

/**
 * L1：悬停上浮 / 轻点缩放
 */
export default function HoverLift({ children, className, strong = false }: HoverLiftProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      whileHover={strong ? hover.CARD : hover.LIFT}
      whileTap={{ scale: 0.98 }}
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.div>
  );
}
