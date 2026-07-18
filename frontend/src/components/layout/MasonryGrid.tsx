'use client';
import { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';
export interface MasonryItem {
  id: string | number;
  content: ReactNode;
  height?: number;
}
export interface MasonryGridProps {
  items: MasonryItem[];
  columns?: number;
  minColumnWidth?: number;
  gap?: number;
  className?: string;
  itemClassName?: string;
  onLayoutComplete?: () => void;
}
export default function MasonryGrid({
  items,
  columns: propColumns,
  minColumnWidth = 250,
  gap = 16,
  className,
  itemClassName,
  onLayoutComplete
}: MasonryGridProps) {
  const [columns, setColumns] = useState(propColumns || 2);
  const [, setColumnHeights] = useState<number[]>([]);
  const [itemPositions, setItemPositions] = useState<Record<string | number, { col: number; row: number }>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string | number, HTMLDivElement>>({});
  useEffect(() => {
    if (propColumns) {
      setColumns(propColumns);
      return;
    }
    const calculateColumns = () => {
      if (!containerRef.current) {return;}
      const containerWidth = containerRef.current.offsetWidth;
      const newColumns = Math.max(1, Math.floor(containerWidth / minColumnWidth));
      setColumns(newColumns);
    };
    calculateColumns();
    window.addEventListener('resize', calculateColumns);
    return () => window.removeEventListener('resize', calculateColumns);
  }, [propColumns, minColumnWidth]);
  useEffect(() => {
    const heights = new Array(columns).fill(0);
    const positions: Record<string | number, { col: number; row: number }> = {};
    items.forEach((item) => {
      const minHeight = Math.min(...heights);
      const col = heights.indexOf(minHeight);
      if (item.height) {
        heights[col] += item.height + gap;
      } else {
        heights[col] += 200 + gap;
      }
      positions[item.id] = { col, row: heights[col] - (item.height || 200) };
    });
    setColumnHeights(heights);
    setItemPositions(positions);
    onLayoutComplete?.();
  }, [items, columns, gap, onLayoutComplete]);
  const renderColumn = (colIndex: number) => {
    const columnItems = items.filter((item, _index) => {
      const pos = itemPositions[item.id];
      return pos?.col === colIndex;
    });
    return (
      <div
        key={colIndex}
        className="flex flex-col"
        style={{ gap: `${gap}px` }}
      >
        <AnimatePresence mode="popLayout">
          {columnItems.map((item) => {
            const pos = itemPositions[item.id];
            if (!pos) {return null;}
            return (
              <motion.div
                key={item.id}
                ref={(el) => {
                  if (el) {
                    itemRefs.current[item.id] = el;
                  }
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={cn(itemClassName)}
                style={{ marginBottom: `${gap}px` }}
              >
                {item.content}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  };
  return (
    <div
      ref={containerRef}
      className={cn('w-full', className)}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {Array.from({ length: columns }).map((_, index) => renderColumn(index))}
    </div>
  );
}