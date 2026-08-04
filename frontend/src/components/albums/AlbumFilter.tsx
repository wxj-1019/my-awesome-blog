'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { Filter, Search, Grid3X3, List, Calendar, TrendingUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassCard from '@/components/ui/GlassCard';
import { useThemedClasses } from '@/hooks/useThemedClasses';

export type FilterType = 'all' | 'featured' | 'recent' | 'popular';
export type SortType = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';
export type ViewMode = 'grid' | 'list' | 'masonry';

interface AlbumFilterProps {
  onFilterChange?: (filter: FilterType) => void;
  onSortChange?: (sort: SortType) => void;
  onViewModeChange?: (view: ViewMode) => void;
  onSearchChange?: (search: string) => void;
  initialFilter?: FilterType;
  initialSort?: SortType;
  initialView?: ViewMode;
  className?: string;
}

const filterOptions: { value: FilterType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: '全部', icon: <Grid3X3 className="w-4 h-4" /> },
  { value: 'featured', label: '精选', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'recent', label: '最新', icon: <Calendar className="w-4 h-4" /> },
  { value: 'popular', label: '热门', icon: <Filter className="w-4 h-4" /> },
];

const sortOptions: { value: SortType; label: string }[] = [
  { value: 'date-desc', label: '日期：从新到旧' },
  { value: 'date-asc', label: '日期：从旧到新' },
  { value: 'title-asc', label: '标题：A-Z' },
  { value: 'title-desc', label: '标题：Z-A' },
];

const AlbumFilter: React.FC<AlbumFilterProps> = ({
  onFilterChange,
  onSortChange,
  onViewModeChange,
  onSearchChange,
  initialFilter = 'all',
  initialSort = 'date-desc',
  initialView = 'grid',
  className,
}) => {
  const [filter, setFilter] = useState<FilterType>(initialFilter);
  const [sort, setSort] = useState<SortType>(initialSort);
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const { themedClasses } = useThemedClasses();

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    onFilterChange?.(newFilter);
  };

  const handleSortChange = (newSort: SortType) => {
    setSort(newSort);
    setSort(sort);
    onSortChange?.(newSort);
    setShowSortDropdown(false);
  };

  const handleViewModeChange = (newView: ViewMode) => {
    setViewMode(newView);
    onViewModeChange?.(newView);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange?.(value);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.sort-dropdown')) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <GlassCard className={cn('p-4', className)}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
            <input
              type="text"
              placeholder="搜索相册..."
              value={searchTerm}
              onChange={handleSearchChange}
              className={cn(
                'w-full pl-10 pr-4 py-2 bg-muted/20 rounded-lg border border-glass-border focus:outline-none focus:ring-2 focus:ring-tech-cyan focus:border-transparent transition-colors',
                themedClasses.textClass
              )}
            />
          </div>
          
          <div className="flex gap-2 sort-dropdown relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-tech-cyan/20 hover:bg-tech-cyan/30 rounded-lg border border-glass-border transition-colors duration-300 flex items-center gap-2"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
            >
              <Filter className="h-4 w-4" />
              <span>排序</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', showSortDropdown && 'rotate-180')} />
            </motion.button>
            
            <AnimatePresence>
              {showSortDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full right-0 mt-2 w-48 bg-glass/95 backdrop-blur-xl border border-glass-border rounded-lg shadow-xl z-50 overflow-hidden"
                >
                  {sortOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ x: 4 }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm transition-colors',
                        'hover:bg-tech-cyan/20',
                        sort === option.value ? 'text-tech-cyan font-semibold' : themedClasses.textClass
                      )}
                      onClick={() => handleSortChange(option.value)}
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'px-4 py-2 rounded-lg border transition-colors duration-300 flex items-center gap-2 text-sm font-medium',
                  filter === option.value
                    ? 'bg-tech-cyan text-primary-foreground border-tech-cyan shadow-md'
                    : 'bg-tech-cyan/10 hover:bg-tech-cyan/20 border-glass-border text-foreground/80 hover:text-foreground'
                )}
                onClick={() => handleFilterChange(option.value)}
              >
                {option.icon}
                <span>{option.label}</span>
              </motion.button>
            ))}
          </div>

          <div className="flex gap-2 p-1 bg-muted/20 rounded-lg border border-glass-border">
            {(['grid', 'list', 'masonry'] as ViewMode[]).map((mode) => {
              const Icon = mode === 'grid' ? Grid3X3 : mode === 'list' ? List : Filter;
              const label = mode === 'grid' ? '网格视图' : mode === 'list' ? '列表视图' : '瀑布流视图';
              return (
                <motion.button
                  key={mode}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'p-2 rounded-md transition-colors duration-300',
                    viewMode === mode
                      ? 'bg-tech-cyan text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-foreground/10'
                  )}
                  onClick={() => handleViewModeChange(mode)}
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </motion.button>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {searchTerm && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="pt-2 border-t border-glass-border"
            >
              <p className="text-sm">
                搜索结果: <span className="text-tech-cyan font-semibold">&quot;{searchTerm}&quot;</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
};

export default AlbumFilter;
