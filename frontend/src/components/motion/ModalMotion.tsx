'use client';

import { AnimatePresence, motion } from '@/lib/framer-motion';
import type { ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE, TRANSITION } from '@/lib/animation-utils';
import { cn } from '@/lib/utils';

interface ModalMotionProps {
  open: boolean;
  children: ReactNode;
  className?: string;
  /** 遮罩 class */
  overlayClassName?: string;
  onOverlayClick?: () => void;
}

/**
 * L2：弹层进出（AnimatePresence）
 */
export default function ModalMotion({
  open,
  children,
  className,
  overlayClassName,
  onOverlayClick,
}: ModalMotionProps) {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="modal-overlay"
            className={cn(
              'fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm',
              overlayClassName
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.08 : 0.2, ease: EASE.SMOOTH }}
            onClick={onOverlayClick}
            aria-hidden
          />
          <motion.div
            key="modal-panel"
            role="dialog"
            aria-modal="true"
            className={cn(
              'fixed left-1/2 top-1/2 z-[90] w-[min(100%-2rem,32rem)] -translate-x-1/2 -translate-y-1/2',
              className
            )}
            initial={
              reduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.98, y: 8 }
            }
            animate={
              reduced
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              reduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.99, y: 4 }
            }
            transition={{
              duration: reduced ? 0.1 : (TRANSITION.FAST.duration as number) ?? 0.28,
              ease: EASE.SMOOTH,
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
