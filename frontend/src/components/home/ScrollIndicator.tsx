'use client';

import { motion, useReducedMotion } from '@/lib/framer-motion';
import { ChevronDown } from 'lucide-react';

export default function ScrollIndicator() {
  const shouldReduceMotion = useReducedMotion();

  const scrollToContent = () => {
    const contentSection = document.getElementById('content');
    if (contentSection) {
      contentSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.button
      onClick={scrollToContent}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 group cursor-pointer"
      initial={shouldReduceMotion ? false : { opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { delay: 1.5, duration: 0.6 }
      }
      aria-label="向下滚动查看内容"
    >
      <span className="text-xs text-white/70 dark:text-white/70 font-medium tracking-wider uppercase">
        向下滚动
      </span>

      <motion.div
        className="relative w-10 h-10 rounded-full border-2 border-white/40 dark:border-white/40 flex items-center justify-center
          group-hover:border-tech-cyan group-hover:bg-tech-cyan/10 transition-all duration-300"
        animate={shouldReduceMotion ? {} : {
          y: [0, 8, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <motion.div
          animate={shouldReduceMotion ? {} : {
            y: [0, 4, 0],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.2,
          }}
        >
          <ChevronDown className="w-5 h-5 text-white/70 dark:text-white/70 group-hover:text-tech-cyan transition-colors" />
        </motion.div>
      </motion.div>

      </motion.button>
  );
}
