'use client';

import { useState, useMemo, memo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { Calendar, TrendingUp, Users, X, Clock } from 'lucide-react';
import Link from 'next/link';
import type { Category, Tag, Article } from '@/types';
import { getTotalArticleCount } from '@/utils/articleHelpers';
import { formatMonthYear } from '@/utils/dateFormat';

interface ArchiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  tags: Tag[];
  hotArticles: Article[];
  onCategorySelect: (categoryId: string | null) => void;
  onTagSelect: (tagId: string | null) => void;
}

function ArchiveDrawer({
  isOpen,
  onClose,
  categories,
  tags,
  hotArticles,
  onCategorySelect,
  onTagSelect,
}: ArchiveDrawerProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'tags' | 'timeline'>('categories');
  const panelRef = useRef<HTMLDivElement>(null);

  // Esc 关闭 + Tab 焦点陷阱：对话框打开期间焦点不得穿透到背景内容
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) {
        return;
      }
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) {
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panelRef.current.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    document.addEventListener('keydown', handleKeyDown);
    // 打开时把焦点移入面板，关闭（或卸载）后归还给此前聚焦的元素
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, handleKeyDown]);

  const groupedArticles = useMemo(() => {
    return hotArticles.reduce((acc, article) => {
      const month = formatMonthYear(article.published_at);
      if (!acc[month]) {acc[month] = [];}
      acc[month].push(article);
      return acc;
    }, {} as Record<string, Article[]>);
  }, [hotArticles]);

  const sortedTags = useMemo(() => [...tags].sort((a, b) => b.article_count - a.article_count), [tags]);
  const topTags = useMemo(() => sortedTags.slice(0, 15), [sortedTags]);

  const totalArticleCount = useMemo(() => getTotalArticleCount(categories), [categories]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="探索：分类、标签与归档"
            tabIndex={-1}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed right-0 top-0 h-full w-full md:w-[450px] z-50 focus:outline-none"
          >
            <div className="
              h-full flex flex-col
              bg-popover border-l border-border text-foreground backdrop-blur-xl
            ">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">
                    探索
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-muted/40 transition-colors"
                    aria-label="关闭"
                  >
                    <X className="w-6 h-6 text-foreground" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setActiveTab('categories')}
                    className={`
                      flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${activeTab === 'categories'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted/40 text-foreground'
                      }
                    `}
                  >
                    分类
                  </button>
                  <button
                    onClick={() => setActiveTab('tags')}
                    className={`
                      flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${activeTab === 'tags'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted/40 text-foreground'
                      }
                    `}
                  >
                    标签
                  </button>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`
                      flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${activeTab === 'timeline'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted/40 text-foreground'
                      }
                    `}
                  >
                    归档
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeTab === 'categories' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => {
                          onCategorySelect(category.id);
                          onClose();
                        }}
                        className="
                          w-full text-left px-4 py-3 rounded-xl transition-colors
                          flex items-center justify-between
                          hover:bg-muted/40 text-foreground
                        "
                      >
                        <span className="font-medium">{category.name}</span>
                        <span className="
                          px-2 py-1 rounded-full text-xs
                          bg-primary/20 text-primary
                        ">
                          {category.article_count}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'tags' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex flex-wrap gap-2">
                      {topTags.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => {
                            onTagSelect(tag.id);
                            onClose();
                          }}
                          className="
                            px-4 py-2 rounded-full text-sm transition-colors
                            bg-primary/10 border border-primary/30 hover:bg-primary/20 text-foreground
                          "
                        >
                          {tag.name}
                          <span className="ml-1 text-xs opacity-60">({tag.article_count})</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'timeline' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {Object.entries(groupedArticles)
                      .reverse()
                      .slice(0, 12)
                      .map(([month, articles]) => (
                        <div key={month}>
                          <div className="flex items-center gap-2 mb-4 text-primary">
                            <Calendar className="w-5 h-5" />
                            <span className="text-sm font-semibold">{month}</span>
                            <span className="text-xs opacity-60">{articles.length} 篇文章</span>
                          </div>
                          <div className="space-y-2 ml-7">
                            {articles.map(article => (
                              <Link
                                key={article.id}
                                href={`/articles/${article.id}`}
                                onClick={onClose}
                                className="
                                  block px-4 py-2 rounded-lg transition-colors
                                  hover:bg-muted/40 text-foreground
                                "
                              >
                                {article.title}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                  </motion.div>
                )}
              </div>

              <div className="p-6 border-t border-border">
                <div className="grid grid-cols-2 gap-4">
                  <div className="
                    p-4 rounded-xl
                    bg-muted/40 border border-border
                  ">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        文章总数
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {totalArticleCount}
                    </p>
                  </div>

                  <div className="
                    p-4 rounded-xl
                    bg-muted/40 border border-border
                  ">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        热门文章
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {hotArticles.length}
                    </p>
                  </div>
                </div>

                {hotArticles.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">
                        热门文章 TOP 3
                      </span>
                    </div>
                    <div className="space-y-2">
                      {hotArticles.slice(0, 3).map((article, index) => (
                        <Link
                          key={article.id}
                          href={`/articles/${article.id}`}
                          onClick={onClose}
                          className="
                            block px-4 py-2 rounded-lg transition-colors flex items-start gap-3
                            hover:bg-muted/40 text-foreground
                          "
                        >
                          <span className={`
                            flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                            ${index === 0
                              ? 'bg-yellow-500 text-white'
                              : index === 1
                                ? 'bg-gray-400 text-white'
                                : 'bg-amber-600 text-white'
                            }
                          `}>
                            {index + 1}
                          </span>
                          <span className="line-clamp-1">{article.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const ArchiveDrawerWithMemo = memo(ArchiveDrawer);
ArchiveDrawerWithMemo.displayName = 'ArchiveDrawer';

export default ArchiveDrawerWithMemo;
