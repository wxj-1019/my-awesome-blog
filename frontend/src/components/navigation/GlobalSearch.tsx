'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, X, Loader2, FileText } from 'lucide-react';
import { searchArticlesFulltext } from '@/lib/api/search';
import type { BackendArticleWithAuthor } from '@/types';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';

/** 输入防抖间隔：与 FilterBar 的 300ms 惯例一致 */
const DEBOUNCE_MS = 300;

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 全站文章搜索弹窗（Cmd/Ctrl+K 或导航按钮唤起）。
 * 防抖 + AbortController：新输入取消在途旧请求，避免旧结果覆盖新结果。
 */
export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BackendArticleWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [retryNonce, setRetryNonce] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  // 关闭时重置全部状态并中止在途请求
  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
      setQuery('');
      setResults([]);
      setLoading(false);
      setError(false);
      setActiveIndex(-1);
    }
  }, [open]);

  // 组件卸载时中止在途请求
  useEffect(() => () => abortRef.current?.abort(), []);

  // 防抖搜索
  useEffect(() => {
    const keyword = query.trim();
    if (!keyword) {
      // 清空输入也要取消在途请求，避免过期响应回填结果
      abortRef.current?.abort();
      setResults([]);
      setError(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const items = await searchArticlesFulltext(keyword, controller.signal);
        setResults(items);
        setError(false);
        setActiveIndex(items.length > 0 ? 0 : -1);
      } catch (err) {
        // 主动取消不算错误（浏览器 abort 抛 AbortError，用名称兜底判断）
        if ((err as { name?: string } | null)?.name === 'AbortError') {
          return;
        }
        setResults([]);
        setError(true);
      } finally {
        if (abortRef.current === controller) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, retryNonce]);

  const goToArticle = useCallback(
    (article: BackendArticleWithAuthor) => {
      onOpenChange(false);
      router.push(`/articles/${article.id}`);
    },
    [onOpenChange, router]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (results.length ? (i + 1) % results.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) =>
        results.length ? (i - 1 + results.length) % results.length : -1
      );
    } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault();
      goToArticle(results[activeIndex]);
    }
  };

  const keyword = query.trim();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            'fixed z-50 left-1/2 top-[12%] -translate-x-1/2',
            'w-[calc(100vw-2rem)] max-w-xl',
            'bg-glass/80 backdrop-blur-xl border border-glass-border rounded-2xl shadow-2xl',
            'focus:outline-none'
          )}
        >
          <Dialog.Title className="sr-only">全局搜索</Dialog.Title>

          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索文章…"
              aria-label="搜索文章"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="关闭搜索"
                className="p-1 rounded-full hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </Dialog.Close>
          </div>

          <div
            className="max-h-[60vh] overflow-y-auto p-2"
            role="listbox"
            aria-label="搜索结果"
          >
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  className="w-5 h-5 animate-spin text-muted-foreground"
                  aria-label="搜索中"
                />
              </div>
            )}

            {!loading && error && (
              <EmptyState
                variant="error"
                size="sm"
                compact
                title="搜索出错了"
                description="请稍后重试"
                // 显式重试动作：error 变体默认 action 是 location.reload，弹窗内不可用
                action={{ label: '重试', onClick: () => setRetryNonce((n) => n + 1) }}
              />
            )}

            {!loading && !error && keyword && results.length === 0 && (
              <EmptyState
                variant="search"
                size="sm"
                compact
                title="没有找到相关文章"
                description="换个关键词试试"
                // 同上：屏蔽 search 变体默认的整页刷新，改为清空弹窗内输入
                action={{ label: '清除搜索', onClick: () => setQuery('') }}
              />
            )}

            {!loading && !error && !keyword && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                输入关键词搜索全站文章
              </p>
            )}

            {!loading &&
              !error &&
              keyword &&
              results.map((article, index) => (
                <button
                  key={article.id}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => goToArticle(article)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    index === activeIndex ? 'bg-muted/60' : 'hover:bg-muted/40'
                  )}
                >
                  {article.cover_image ? (
                    // 封面来自 MinIO/外部 URL，缩略图场景用裸 img（项目惯例，见 CoverPicker）
                    <img
                      src={article.cover_image}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                      <FileText
                        className="w-5 h-5 text-muted-foreground"
                        aria-hidden
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {article.title}
                    </p>
                    {article.excerpt && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
