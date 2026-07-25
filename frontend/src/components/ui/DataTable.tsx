'use client';

import * as React from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown, 
  Search, 
  Filter, 
  X, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

export interface Column<T> {
  key: string;
  title: string;
  width?: string | number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  cellClassName?: string;
}

export interface FilterConfig {
  key: string;
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string | number | boolean;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField?: string;
  loading?: boolean;
  empty?: {
    title?: string;
    description?: string;
  };
  pageSize?: number;
  pagination?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: string;
  animationDelay?: number;
  className?: string;
}

function DataTable<T>({
  data,
  columns,
  keyField = 'id',
  loading = false,
  empty,
  pageSize = 10,
  pagination = true,
  selectable = false,
  onSelectionChange,
  onRowClick,
  rowClassName,
  animationDelay: _animationDelay = 0,
  className,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = React.useState<SortConfig | null>(null);
  const [filters, setFilters] = React.useState<FilterConfig[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedRows, setSelectedRows] = React.useState<Set<string | number>>(new Set());
  const [showFilters, setShowFilters] = React.useState(false);

  const filterInputRefs = React.useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | null }>({});

  const sortedAndFilteredData = React.useMemo(() => {
    let result = [...data];

    if (searchQuery) {
      result = result.filter((row) =>
        columns.some((col) => {
          const value = row[col.key as keyof T];
          return String(value).toLowerCase().includes(searchQuery.toLowerCase());
        })
      );
    }

    filters.forEach((filter) => {
      result = result.filter((row) => {
        const value = row[filter.key as keyof T];
        
        switch (filter.operator) {
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'equals':
            return value === filter.value;
          case 'startsWith':
            return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
          case 'endsWith':
            return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
          case 'gt':
            return Number(value) > Number(filter.value);
          case 'lt':
            return Number(value) < Number(filter.value);
          case 'gte':
            return Number(value) >= Number(filter.value);
          case 'lte':
            return Number(value) <= Number(filter.value);
          default:
            return true;
        }
      });
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof T];
        const bValue = b[sortConfig.key as keyof T];
        
        if (aValue === bValue) {return 0;}
        
        const comparison = aValue < bValue ? -1 : 1;
        return sortConfig.direction === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [data, searchQuery, filters, sortConfig, columns]);

  const paginatedData = React.useMemo(() => {
    if (!pagination) {return sortedAndFilteredData;}
    
    const startIndex = (currentPage - 1) * pageSize;
    return sortedAndFilteredData.slice(startIndex, startIndex + pageSize);
  }, [sortedAndFilteredData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedAndFilteredData.length / pageSize);

  const handleSort = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column?.sortable) {return;}

    setSortConfig((prev) => {
      if (prev?.key === columnKey) {
        return prev.direction === 'asc' ? { key: columnKey, direction: 'desc' } : null;
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  const handleFilter = (columnKey: string, operator: string, value: string) => {
    setFilters((prev) => {
      const existingIndex = prev.findIndex((f) => f.key === columnKey);
      
      if (!value.trim()) {
        return prev.filter((f) => f.key !== columnKey);
      }

      const newFilter: FilterConfig = {
        key: columnKey,
        operator: operator as FilterConfig['operator'],
        value,
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newFilter;
        return updated;
      }

      return [...prev, newFilter];
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleRowSelect = (row: T, checked: boolean) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      const keyValue = row[keyField as keyof T] as string | number;
      
      if (checked) {
        newSet.add(keyValue);
      } else {
        newSet.delete(keyValue);
      }
      
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = paginatedData.map((row) => row[keyField as keyof T] as string | number);
      setSelectedRows(new Set(allKeys));
    } else {
      setSelectedRows(new Set());
    }
  };

  React.useEffect(() => {
    const selectedData = data.filter((row) =>
      selectedRows.has(row[keyField as keyof T] as string | number)
    );
    onSelectionChange?.(selectedData);
  }, [selectedRows, data, keyField, onSelectionChange]);

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-foreground/40" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-tech-cyan" />
    ) : (
      <ChevronDown className="w-4 h-4 text-tech-cyan" />
    );
  };

  if (loading) {
    return (
      <motion.div
        className={cn('flex items-center justify-center py-16', className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-12 h-12 border-4 border-tech-cyan/30 border-t-tech-cyan rounded-full animate-spin" />
      </motion.div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        className={className}
        icon={Search}
        title={empty?.title || '暂无数据'}
        description={empty?.description || '这里暂时没有任何内容'}
      />
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="搜索..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/40 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-tech-cyan/20 focus:border-tech-cyan/50 transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
              aria-label="清除"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'px-4 py-2.5 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2',
            showFilters
              ? 'bg-tech-cyan text-white'
              : 'bg-white/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 text-foreground hover:bg-slate-100 dark:hover:bg-slate-700/40'
          )}
        >
          <Filter className="w-4 h-4" />
          筛选
        </motion.button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {columns.filter(col => col.filterable).map((col) => {
                const activeFilter = filters.find(f => f.key === col.key);
                return (
                  <div key={col.key} className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground/70">
                      {col.title}
                    </label>
                    <div className="flex gap-2">
                      <select
                        ref={(el) => { filterInputRefs.current[col.key] = el; }}
                        className="flex-shrink-0 px-2 py-1.5 text-sm rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-tech-cyan/20"
                        defaultValue="contains"
                      >
                        <option value="contains">包含</option>
                        <option value="equals">等于</option>
                        <option value="startsWith">开始于</option>
                        <option value="endsWith">结束于</option>
                      </select>
                      <input
                        type="text"
                        defaultValue={activeFilter?.value as string}
                        onChange={(e) => {
                          const selectEl = filterInputRefs.current[col.key];
                          handleFilter(col.key, selectEl?.value || 'contains', e.target.value);
                        }}
                        placeholder={`筛选 ${col.title}`}
                        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-tech-cyan/20"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/40 backdrop-blur-xl">
        <table className="w-full">
          <thead className="bg-slate-50/50 dark:bg-slate-900/30">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && paginatedData.every(row =>
                      selectedRows.has(row[keyField as keyof T] as string | number)
                    )}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-tech-cyan focus:ring-tech-cyan focus:ring-offset-0"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wider transition-colors',
                    col.sortable && 'cursor-pointer hover:text-tech-cyan hover:bg-tech-cyan/5',
                    col.cellClassName
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.title}
                    {col.sortable && <SortIcon columnKey={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
            <AnimatePresence mode="popLayout">
              {paginatedData.map((row, index) => {
                const keyValue = row[keyField as keyof T] as string | number;
                const isSelected = selectedRows.has(keyValue);
                
                return (
                  <motion.tr
                    key={keyValue}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    className={cn(
                      'group transition-colors duration-200',
                      onRowClick && 'cursor-pointer hover:bg-tech-cyan/5',
                      isSelected && 'bg-tech-cyan/10',
                      rowClassName
                    )}
                    onClick={() => onRowClick?.(row, index)}
                  >
                    {selectable && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleRowSelect(row, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-tech-cyan focus:ring-tech-cyan focus:ring-offset-0"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3 text-sm text-foreground',
                          col.cellClassName
                        )}
                      >
                        {col.render ? col.render(row[col.key as keyof T], row, index) : String(row[col.key as keyof T] || '-')}
                      </td>
                    ))}
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-foreground/60">
            显示 {((currentPage - 1) * pageSize) + 1} 到 {Math.min(currentPage * pageSize, sortedAndFilteredData.length)} 条，共 {sortedAndFilteredData.length} 条
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-700/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="上一页"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </motion.button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                const isCurrentPage = pageNum === currentPage;
                
                return (
                  <motion.button
                    key={pageNum}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'w-10 h-10 rounded-lg font-medium transition-colors duration-200',
                      isCurrentPage
                        ? 'bg-tech-cyan text-white'
                        : 'border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-700/40'
                    )}
                  >
                    {pageNum}
                  </motion.button>
                );
              })}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-700/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="下一页"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
