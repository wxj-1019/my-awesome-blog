'use client';
import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
export interface SplitPaneProps {
  children: [ReactNode, ReactNode];
  defaultSplit?: number;
  minSize?: number;
  maxSize?: number;
  orientation?: 'horizontal' | 'vertical';
  resizable?: boolean;
  collapsible?: boolean;
  showCollapseButtons?: boolean;
  className?: string;
}
export default function SplitPane({
  children,
  defaultSplit = 50,
  minSize = 20,
  maxSize = 80,
  orientation = 'horizontal',
  resizable = true,
  collapsible = true,
  showCollapseButtons = true,
  className
}: SplitPaneProps) {
  const [split, setSplit] = useState(defaultSplit);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const separatorRef = useRef<HTMLDivElement>(null);
  const isHorizontal = orientation === 'horizontal';
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) {return;}
      const rect = containerRef.current.getBoundingClientRect();
      const newSize = isHorizontal
        ? ((e.clientX - rect.left) / rect.width) * 100
        : ((e.clientY - rect.top) / rect.height) * 100;
      setSplit(Math.max(minSize, Math.min(maxSize, newSize)));
    };
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isHorizontal, minSize, maxSize]);
  const handleSeparatorMouseDown = (e: React.MouseEvent) => {
    if (!resizable) {return;}
    e.preventDefault();
    setIsResizing(true);
  };
  const collapseLeft = () => {
    if (!collapsible) {return;}
    setIsCollapsed(true);
  };
  const collapseRight = () => {
    if (!collapsible) {return;}
    setIsCollapsed(false);
  };
  const handleMaximize = () => {
    setSplit(isHorizontal ? 100 : 100);
    setIsCollapsed(false);
  };
  const handleReset = () => {
    setSplit(defaultSplit);
    setIsCollapsed(false);
  };
  const currentSplit = isCollapsed ? 0 : split;
  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex',
        isHorizontal ? 'flex-row' : 'flex-col',
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: isCollapsed ? 0 : 1, width: `${currentSplit}%` }}
        transition={{ duration: 0.2 }}
        className={cn(
          'overflow-hidden',
          isHorizontal ? 'border-r' : 'border-b',
          'border-glass-border'
        )}
      >
        {children[0]}
      </motion.div>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            ref={separatorRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'flex items-center justify-center relative z-10',
              isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'
            )}
            onMouseDown={handleSeparatorMouseDown}
            style={{ cursor: isResizing ? (isHorizontal ? 'col-resize' : 'row-resize') : undefined }}
          >
            {resizable && (
              <div className={cn(
                'absolute flex items-center justify-center bg-tech-cyan hover:bg-tech-lightcyan transition-colors',
                isHorizontal
                  ? 'inset-y-0 w-1 hover:w-1.5'
                  : 'inset-x-0 h-1 hover:h-1.5'
              )}>
                <GripVertical className={cn('text-white', isHorizontal ? 'w-3 h-3' : 'w-3 h-3 rotate-90')} />
              </div>
            )}
            {showCollapseButtons && (
              <div className={cn(
                'absolute flex gap-1',
                isHorizontal ? '-right-8 top-1/2 -translate-y-1/2 flex-col' : '-bottom-8 left-1/2 -translate-x-1/2 flex-row'
              )}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={collapseLeft}
                  className="p-1.5 rounded bg-glass/30 hover:bg-glass/50 text-foreground/70 hover:text-foreground transition-colors"
                  title="折叠左侧"
                  aria-label="折叠左侧"
                >
                  {isHorizontal ? <ChevronLeft className="w-3 h-3" aria-hidden="true" /> : <ChevronUp className="w-3 h-3" aria-hidden="true" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={collapseRight}
                  className="p-1.5 rounded bg-glass/30 hover:bg-glass/50 text-foreground/70 hover:text-foreground transition-colors"
                  title="折叠右侧"
                  aria-label="折叠右侧"
                >
                  {isHorizontal ? <ChevronRight className="w-3 h-3" aria-hidden="true" /> : <ChevronDown className="w-3 h-3" aria-hidden="true" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMaximize}
                  className="p-1.5 rounded bg-glass/30 hover:bg-glass/50 text-foreground/70 hover:text-foreground transition-colors"
                  title="最大化"
                  aria-label="最大化"
                >
                  <Maximize2 className="w-3 h-3" aria-hidden="true" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  className="p-1.5 rounded bg-glass/30 hover:bg-glass/50 text-foreground/70 hover:text-foreground transition-colors"
                  title="重置"
                  aria-label="重置"
                >
                  <Minimize2 className="w-3 h-3" aria-hidden="true" />
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: `${100 - currentSplit}%` }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        {children[1]}
      </motion.div>
      {isResizing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/20 cursor-opaque"
        />
      )}
    </div>
  );
}