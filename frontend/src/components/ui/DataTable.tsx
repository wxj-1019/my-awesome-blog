'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  id: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
  rowClassName?: (item: T) => string;
}

const DataTable = <T,>({
  data,
  columns,
  loading = false,
  onRowClick,
  className,
  emptyMessage = '暂无数据',
  rowClassName
}: DataTableProps<T>) => {
  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (columnId: string) => {
    setSortConfig(prev => {
      if (!prev || prev.key !== columnId) {
        return { key: columnId, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key: columnId, direction: 'desc' };
      }
      return null;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div 
          className="relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-12 h-12 border-4 border-tech-cyan/30 border-t-tech-cyan rounded-full animate-spin" />
        </motion.div>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <motion.div 
        className="text-center py-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-glass/20 backdrop-blur-lg border border-glass-border/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-foreground/60">{emptyMessage}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        "rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/30 backdrop-blur-xl",
        "overflow-hidden shadow-lg text-slate-800 dark:text-slate-100",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20">
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    "px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider",
                    column.width && `w-[${column.width}]`,
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right'
                  )}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.id)}
                      className="flex items-center gap-2 group hover:text-foreground transition-colors"
                    >
                      <span>{column.label}</span>
                      <motion.div
                        className="relative"
                        animate={{
                          rotate: sortConfig?.key === column.id 
                            ? (sortConfig.direction === 'asc' ? 0 : 180) 
                            : 0
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg 
                          className={cn(
                            "w-4 h-4 transition-colors",
                            sortConfig?.key === column.id 
                              ? "text-tech-cyan" 
                              : "text-foreground/40 group-hover:text-foreground/60"
                          )} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </motion.div>
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/30 dark:divide-slate-700/30">
            {sortedData.map((item, index) => (
              <motion.tr
                key={index}
                className={cn(
                  "hover:bg-slate-100/30 dark:hover:bg-slate-700/20 transition-all duration-300 cursor-pointer group",
                  rowClassName?.(item),
                  onRowClick && "hover:-translate-y-0.5"
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
                whileHover={{ 
                  boxShadow: "0 4px 20px rgba(59, 130, 246, 0.1)",
                  borderColor: "rgba(59, 130, 246, 0.2)",
                  backgroundColor: "rgba(241, 245, 249, 0.3)"
                }}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      "px-6 py-4 text-sm text-slate-700 dark:text-slate-300",
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right'
                    )}
                  >
                    {column.render ? (
                      column.render(item)
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "truncate",
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}>
                          {(item as any)[column.id] ?? '-'}
                        </span>
                      </div>
                    )}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default DataTable;