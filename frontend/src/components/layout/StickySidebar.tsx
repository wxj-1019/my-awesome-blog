'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StickySidebarProps {
  children: ReactNode;
  position?: 'left' | 'right';
  width?: string;
  collapsedWidth?: string;
  isCollapsible?: boolean;
  isSticky?: boolean;
  offset?: number;
  className?: string;
  onCollapseChange?: (collapsed: boolean) => void;
}

export default function StickySidebar({
  children,
  position = 'left',
  width = '280px',
  collapsedWidth = '60px',
  isCollapsible = true,
  isSticky = true,
  offset = 20,
  className,
  onCollapseChange
}: StickySidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isStickyActive, setIsStickyActive] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current) {
        setIsOverflowing(
          contentRef.current.scrollHeight > contentRef.current.clientHeight
        );
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [children]);

  useEffect(() => {
    if (!isSticky) {return;}

    const handleScroll = () => {
      if (sidebarRef.current) {
        const rect = sidebarRef.current.getBoundingClientRect();
        setIsStickyActive(rect.top <= offset);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSticky, offset]);

  const handleCollapse = () => {
    if (!isCollapsible) {return;}
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  const isLeft = position === 'left';

  return (
    <div
      ref={sidebarRef}
      className={cn(
        'relative z-40 transition-all duration-300',
        isLeft ? 'border-r' : 'border-l',
        'border-glass-border',
        isSticky && 'sticky top-0',
        className
      )}
      style={{
        width: isCollapsed ? collapsedWidth : width,
        maxWidth: isCollapsed ? collapsedWidth : width,
        height: isSticky ? `calc(100vh - ${offset * 2}px)` : 'auto',
        top: isSticky ? `${offset}px` : undefined,
      }}
    >
      <div
        ref={contentRef}
        className={cn(
          'h-full overflow-y-auto overflow-x-hidden',
          'transition-all duration-300',
          'scrollbar-thin scrollbar-thumb-glass-border scrollbar-track-transparent'
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isCollapsed ? 'collapsed' : 'expanded'}
            initial={{ opacity: 0, x: isLeft ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isLeft ? -10 : 10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'p-4',
              isCollapsed ? 'px-2' : 'px-4'
            )}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {isCollapsible && (
        <motion.button
          onClick={handleCollapse}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 z-50 p-2 rounded-full',
            'bg-tech-cyan hover:bg-tech-lightcyan',
            'text-white shadow-lg transition-[colors,transform] duration-200',
            isLeft ? '-right-3' : '-left-3'
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          aria-label={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {isCollapsed ? (
            isLeft ? (
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            )
          ) : isLeft ? (
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          )}
        </motion.button>
      )}

      {isOverflowing && !isCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-glass/80 to-transparent pointer-events-none">
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-tech-cyan/50 to-transparent animate-pulse" />
        </div>
      )}

      {isStickyActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'absolute top-0 left-0 right-0 h-1',
            'bg-gradient-to-r from-transparent via-tech-cyan to-transparent',
            'shadow-[0_0_10px_var(--shadow-tech-cyan)]'
          )}
        />
      )}
    </div>
  );
}
