'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { Search, Filter, Grid, List, Sparkles, X, Keyboard } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface CommandBarProps {
  categories: Array<{ id: string; name: string; slug: string }>;
  tags: Array<{ id: string; name: string; slug: string }>;
  onCategoryChange: (categoryId: string | null) => void;
  onTagChange: (tagId: string | null) => void;
  onSearchChange: (query: string) => void;
  onViewToggle: (view: 'grid' | 'list') => void;
  currentView: 'grid' | 'list';
  onOpenDrawer: () => void;
}

function CommandBar({
  categories,
  tags,
  onCategoryChange,
  onTagChange,
  onSearchChange,
  onViewToggle,
  currentView,
  onOpenDrawer,
}: CommandBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchChange(query);
  }, [onSearchChange]);

  const handleCategoryClick = useCallback((categoryId: string | null) => {
    onCategoryChange(categoryId);
    setFilterOpen(false);
  }, [onCategoryChange]);

  const handleTagClick = useCallback((tagId: string | null) => {
    onTagChange(tagId);
    setFilterOpen(false);
  }, [onTagChange]);

  const clearFilters = useCallback(() => {
    handleCategoryClick(null);
    handleTagClick(null);
  }, [handleCategoryClick, handleTagClick]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setFilterOpen(true);
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        e.preventDefault();
        onViewToggle(currentView === 'grid' ? 'list' : 'grid');
      }

      if (e.key === 'Escape') {
        if (searchOpen) {
          setSearchOpen(false);
        }
        if (filterOpen) {
          setFilterOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, filterOpen, currentView, onViewToggle]);

  const activeCategory = categories.find(c => c.id === searchParams?.get('category'));
  const activeTag = tags.find(t => t.id === searchParams?.get('tag'));

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 hidden md:block">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="
            backdrop-blur-xl border border-border rounded-full px-6 py-3
            flex items-center gap-4 shadow-2xl
            bg-popover/90
          "
          role="toolbar"
          aria-label="文章操作工具栏"
        >
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-full hover:bg-muted/40 transition-all active:scale-95"
            aria-label="搜索文章 (Ctrl+K)"
            title="搜索文章 (Ctrl+K)"
          >
            <Search className="w-5 h-5 text-foreground" aria-hidden="true" />
          </button>

          <div className="h-6 w-px bg-border" />

          <button
            onClick={() => setFilterOpen(true)}
            className="p-2 rounded-full hover:bg-muted/40 transition-all active:scale-95"
            aria-label="筛选文章 (Ctrl+F)"
            title="筛选文章 (Ctrl+F)"
          >
            <Filter className="w-5 h-5 text-foreground" aria-hidden="true" />
          </button>

          <div className="h-6 w-px bg-border" />

          <button
            onClick={() => onViewToggle(currentView === 'grid' ? 'list' : 'grid')}
            className="p-2 rounded-full hover:bg-muted/40 transition-all active:scale-95"
            aria-label={`切换视图模式，当前为${currentView === 'grid' ? '网格' : '列表'} (Ctrl+V)`}
            title={`切换视图模式 (Ctrl+V)`}
          >
            {currentView === 'grid' ? (
              <List className="w-5 h-5 text-foreground" aria-hidden="true" />
            ) : (
              <Grid className="w-5 h-5 text-foreground" aria-hidden="true" />
            )}
          </button>

          {(activeCategory || activeTag) && (
            <>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {activeCategory?.name || activeTag?.name}
                </span>
                <button
                  onClick={clearFilters}
                  className="p-1 rounded-full hover:bg-muted/40 transition-all"
                  aria-label="清除筛选"
                >
                  <X className="w-3 h-3 text-foreground" aria-hidden="true" />
                </button>
              </div>
            </>
          )}

          <button
            onClick={onOpenDrawer}
            className="p-2 rounded-full bg-primary hover:bg-primary/90 transition-all active:scale-95 shadow-[0_0_15px_var(--shadow-tech-cyan)]"
            aria-label="打开侧边栏查看更多选项"
          >
            <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setSearchOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-start justify-center pt-24"
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-title"
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="
                w-full max-w-2xl mx-4 rounded-2xl p-6
                bg-popover border border-border text-foreground
              "
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 id="search-title" className="text-xl font-bold text-foreground">
                    搜索文章
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Keyboard className="w-4 h-4" />
                    <kbd className="px-2 py-1 rounded bg-muted/50 font-mono">Ctrl+K</kbd>
                  </div>
                </div>
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-2 rounded-full hover:bg-muted/40 transition-all"
                  aria-label="关闭搜索"
                >
                  <X className="w-5 h-5 text-foreground" aria-hidden="true" />
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="输入关键词搜索..."
                  value={searchQuery}
                  onChange={handleSearch}
                  autoFocus
                  className="
                    w-full px-5 py-4 rounded-xl text-lg
                    bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground
                    focus:outline-none focus:ring-2 focus:ring-primary
                  "
                  aria-label="搜索输入框"
                  id="search-input"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>

              {searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/30"
                >
                  <p className="text-sm text-foreground">
                    按 <kbd className="px-2 py-1 rounded bg-muted/50 text-primary font-mono">Enter</kbd> 键开始搜索
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed right-0 top-0 h-full w-full md:w-[400px] z-[110]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-title"
          >
            <div className="
              h-full w-full backdrop-blur-xl
              bg-popover border-l border-border text-foreground
            ">
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <h2 id="filter-title" className="text-2xl font-bold text-foreground">
                      筛选
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Keyboard className="w-4 h-4" />
                      <kbd className="px-2 py-1 rounded bg-muted/50 font-mono">Ctrl+F</kbd>
                    </div>
                  </div>
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="p-2 rounded-full hover:bg-muted/40 transition-all"
                    aria-label="关闭筛选"
                  >
                    <X className="w-5 h-5 text-foreground" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-8">
                  <div>
                    <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-primary">
                      分类
                    </h3>
                    <div className="space-y-2" role="radiogroup" aria-label="文章分类">
                      <button
                        onClick={() => handleCategoryClick(null)}
                        className={`
                          w-full text-left px-4 py-3 rounded-lg transition-all
                          ${!activeCategory
                            ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                            : 'hover:bg-muted/40 text-foreground'
                          }
                        `}
                        role="radio"
                        aria-checked={!activeCategory}
                        aria-label="全部分类"
                      >
                        全部分类
                      </button>
                      {categories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryClick(category.id)}
                          className={`
                            w-full text-left px-4 py-3 rounded-lg transition-all
                            ${activeCategory?.id === category.id
                              ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                              : 'hover:bg-muted/40 text-foreground'
                            }
                          `}
                          role="radio"
                          aria-checked={activeCategory?.id === category.id}
                          aria-label={`分类: ${category.name}`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-primary">
                      热门标签
                    </h3>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="文章标签">
                      {tags.slice(0, 10).map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => handleTagClick(tag.id)}
                          className={`
                            px-3 py-1.5 rounded-full text-sm transition-all
                            ${activeTag?.id === tag.id
                              ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                              : 'bg-muted/50 text-foreground hover:bg-muted'
                            }
                          `}
                          role="checkbox"
                          aria-checked={activeTag?.id === tag.id}
                          aria-label={`标签: ${tag.name}`}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleCategoryClick(null);
                    handleTagClick(null);
                  }}
                  className="w-full py-3 rounded-lg border border-border hover:bg-muted/40 transition-all text-foreground"
                  aria-label="清除所有筛选条件"
                >
                  清除所有筛选
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const CommandBarWithMemo = memo(CommandBar);
CommandBarWithMemo.displayName = 'CommandBar';

export default CommandBarWithMemo;
