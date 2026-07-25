'use client';

import * as React from 'react';
import { motion } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';
import { Search, Filter, X } from 'lucide-react';

interface SearchFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: Array<{
    id: string;
    label: string;
    options: Array<{ value: string; label: string }>;
    value: string;
    onChange: (value: string) => void;
  }>;
  placeholder?: string;
  className?: string;
  onClear?: () => void;
}

const SearchFilter = ({
  searchValue,
  onSearchChange,
  filters = [],
  placeholder = '搜索...',
  className,
  onClear
}: SearchFilterProps) => {
  const [showFilters, setShowFilters] = React.useState(false);
  const hasActiveFilters = filters.some(filter => filter.value !== '');

  return (
    <motion.div
      className={cn(
        "bg-glass/20 backdrop-blur-xl border border-glass-border rounded-2xl p-4 shadow-lg text-foreground",
        className
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Search className="w-5 h-5 text-foreground/50" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            aria-label="搜索关键词"
            className="w-full pl-10 pr-4 py-3 bg-transparent border border-glass-border rounded-xl
                     text-foreground placeholder:text-foreground/50
                     focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 focus:border-tech-cyan/50
                     transition-colors duration-300"
          />
          {onClear && (searchValue || hasActiveFilters) && (
            <motion.button
              onClick={onClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg
                       text-foreground/50 hover:text-foreground hover:bg-glass/30
                       transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="清除"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </motion.button>
          )}
        </div>

        {/* Filter Toggle */}
        {filters.length > 0 && (
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors duration-300",
              showFilters || hasActiveFilters
                ? "bg-tech-cyan/20 border-tech-cyan text-tech-cyan"
                : "bg-glass/30 border-glass-border text-foreground/70 hover:bg-glass/50 hover:text-foreground"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">筛选</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-tech-cyan animate-pulse" />
            )}
          </motion.button>
        )}
      </div>

      {/* Filters Panel */}
      {filters.length > 0 && showFilters && (
        <motion.div
          className="mt-4 pt-4 border-t border-glass-border"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.id} className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">
                  {filter.label}
                </label>
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-glass/30 backdrop-blur-lg border border-glass-border 
                           rounded-lg text-foreground focus:outline-none focus:ring-2 
                           focus:ring-tech-cyan/50 focus:border-tech-cyan/50 transition-colors duration-300"
                >
                  <option value="">全部</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SearchFilter;