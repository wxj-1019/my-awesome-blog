'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { LayoutGrid, X, Search, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemedClasses } from '@/hooks/useThemedClasses';

export interface QuickNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href: string;
  shortcut?: string;
  description?: string;
}

interface QuickNavProps {
  items: QuickNavItem[];
  trigger?: React.ReactNode;
  className?: string;
}

export default function QuickNav({ items, trigger, className }: QuickNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { getThemeClass } = useThemedClasses();

  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setSearchQuery('');
        setSelectedIndex(0);
      }

      if (isOpen) {
        if (e.key === 'Escape') {
          setIsOpen(false);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
          window.location.href = filteredItems[selectedIndex].href;
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleItemClick = (item: QuickNavItem) => {
    window.location.href = item.href;
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
          getThemeClass(
            'bg-glass/20 border-glass-border text-foreground hover:bg-glass/40',
            'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
          ),
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {trigger || (
          <>
            <LayoutGrid className="w-4 h-4" />
            <span className="text-sm">快速导航</span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-foreground/10">
              <Command className="w-3 h-3" />
              <span className="text-xs">K</span>
            </div>
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-2xl shadow-2xl z-50',
                getThemeClass('bg-[#1a1a2e] border-glass-border', 'bg-white border-gray-200'),
                'border overflow-hidden'
              )}
            >
              <div className="p-4 border-b border-glass-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索页面或功能..."
                    autoFocus
                    className={cn(
                      'w-full pl-10 pr-4 py-3 rounded-lg text-sm',
                      getThemeClass(
                        'bg-glass/20 border-glass-border text-foreground placeholder:text-foreground/50',
                        'bg-gray-100 border-gray-200 text-gray-800 placeholder:text-gray-400'
                      ),
                      'focus:outline-none focus:ring-2 focus:ring-tech-cyan/20 focus:border-tech-cyan'
                    )}
                  />
                  <button
                    onClick={() => setIsOpen(false)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-glass/20 text-foreground/50 hover:text-foreground transition-colors"
                    aria-label="关闭"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto p-2">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-12 text-foreground/50">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">未找到匹配的结果</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {filteredItems.map((item, index) => (
                      <motion.button
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={cn(
                          'relative flex items-start gap-3 p-3 rounded-lg text-left transition-all',
                          selectedIndex === index
                            ? 'bg-tech-cyan/20 border-tech-cyan/50'
                            : getThemeClass('hover:bg-glass/20', 'hover:bg-gray-100'),
                          'border border-transparent'
                        )}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex-shrink-0 p-2 rounded bg-tech-cyan/10">
                          {item.icon || <LayoutGrid className="w-4 h-4 text-tech-cyan" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-foreground">
                              {item.label}
                            </span>
                            {item.shortcut && (
                              <span className="text-xs text-foreground/50 font-mono">
                                {item.shortcut}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-foreground/60 mt-0.5 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {selectedIndex === index && (
                          <motion.div
                            layoutId="selectedQuickNav"
                            className="absolute inset-0 rounded-lg bg-tech-cyan/10 pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-4 py-3 border-t border-glass-border text-xs text-foreground/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="font-mono">↑↓</span>
                    导航
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-mono">Enter</span>
                    选择
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-mono">Esc</span>
                    关闭
                  </span>
                </div>
                <span>{filteredItems.length} 个结果</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
