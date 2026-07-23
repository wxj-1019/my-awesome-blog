'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { Search, X, Grid, List, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterBarProps {
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewToggle: (view: 'grid' | 'list') => void;
  onOpenDrawer: () => void;
}

/** 搜索防抖间隔 ms */
const SEARCH_DEBOUNCE = 300;

/**
 * 文章页筛选工具条：搜索框 + 视图切换 + 归档入口。
 * 分类/标签筛选已移交右侧边栏（CategoryNav / SidebarTagCloud），此处保持精简。
 * 圆角玻璃卡形态融入内容流（非 sticky 通栏），不切割页面。
 * 全 token 配色；Ctrl+K 聚焦搜索框。
 */
function FilterBar({
  onSearchChange,
  viewMode,
  onViewToggle,
  onOpenDrawer,
}: FilterBarProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // 输入防抖：300ms 后再触发实际搜索
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      onSearchChange(inputValue.trim());
    }, SEARCH_DEBOUNCE);
    return () => clearTimeout(debounceRef.current);
    // onSearchChange 由父组件 useCallback 稳定化
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  // Ctrl+K 聚焦搜索框
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="mb-8"
      role="search"
      aria-label="文章筛选栏"
    >
      <div className="rounded-2xl bg-glass/50 backdrop-blur-xl border border-glass-border p-3.5 sm:p-4 flex items-center gap-3">
        {/* 搜索框：常显，Ctrl+K 聚焦 */}
        <div className="relative flex-1 min-w-0">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="搜索文章…（Ctrl+K）"
            aria-label="搜索文章"
            className={cn(
              'w-full pl-10 pr-9 py-2.5 rounded-xl text-sm',
              'bg-muted/40 border border-border text-foreground',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
              'transition-shadow'
            )}
          />
          {inputValue && (
            <button
              onClick={() => setInputValue('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted/60 transition-colors"
              aria-label="清空搜索"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* 视图切换 */}
        <div
          className="flex-shrink-0 flex items-center rounded-xl bg-muted/40 border border-border p-1"
          role="group"
          aria-label="视图切换"
        >
          {(['grid', 'list'] as const).map((mode) => {
            const Icon = mode === 'grid' ? Grid : List;
            const active = viewMode === mode;
            return (
              <button
                key={mode}
                onClick={() => onViewToggle(mode)}
                aria-pressed={active}
                aria-label={mode === 'grid' ? '网格视图' : '列表视图'}
                className={cn(
                  'p-2 rounded-lg transition-all duration-200',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" aria-hidden />
              </button>
            );
          })}
        </div>

        {/* 归档入口（保留 ArchiveDrawer） */}
        <button
          onClick={onOpenDrawer}
          className="flex-shrink-0 p-2.5 rounded-xl bg-muted/40 border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          aria-label="打开归档抽屉"
          title="归档与热门"
        >
          <Archive className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

const FilterBarWithMemo = memo(FilterBar);
FilterBarWithMemo.displayName = 'FilterBar';

export default FilterBarWithMemo;
