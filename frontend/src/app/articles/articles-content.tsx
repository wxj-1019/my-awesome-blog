'use client';
import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import { getArticles, getCategories, getTags } from '@/services/articleService';
import { useLoading } from '@/context/loading-context';
import ArchiveDrawer from '@/components/articles/ArchiveDrawer';
import ArticleSidebar from '@/app/articles/components/ArticleSidebar';
import FilterBar from '@/components/articles/FilterBar';
import ArticleListItem from '@/components/articles/ArticleListItem';
import Loader from '@/components/loading/Loader';
import EmptyState from '@/components/ui/EmptyState';
import ArticleCard, { ArticleCardSkeleton } from '@/components/ui/ArticleCard';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion';
import { Article, Category, Tag } from '@/types';
import logger from '@/utils/logger';
import { getHotArticles } from '@/utils/articleHelpers';
import { useArticleFilters } from '@/hooks/useArticleFilters';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { BookOpen } from 'lucide-react';
import type { Route } from 'next';

const ARTICLES_PER_PAGE = 12;

/** RSC 预取的首屏数据（page.tsx 服务端按 URL 筛选参数拉取） */
export interface PrefetchedArticlesData {
  articles: Article[];
  categories: Category[];
  tags: Tag[];
  hasMore: boolean;
  category?: string | null;
  tag?: string | null;
  search?: string | null;
}

/** 将后端 Article 映射为统一 ArticleCard 的 props */
function toCardProps(article: Article) {
  return {
    id: article.id,
    title: article.title,
    excerpt: article.excerpt || '',
    date: article.published_at
      ? new Date(article.published_at).toLocaleDateString('zh-CN')
      : '',
    readTime: article.read_time ? `${article.read_time} min` : undefined,
    category: article.categories?.[0]?.name,
    coverImage: article.cover_image || undefined,
    likes: article.likes_count || 0,
    comments: article.comments_count || 0,
    href: `/articles/${article.id}` as Route,
  };
}

function ArticlesPageContent({ prefetched }: { prefetched?: PrefetchedArticlesData }) {
  const [articles, setArticles] = useState<Article[]>(prefetched?.articles ?? []);
  const [categories, setCategories] = useState<Category[]>(prefetched?.categories ?? []);
  const [tags, setTags] = useState<Tag[]>(prefetched?.tags ?? []);
  const [loading, setLoading] = useState(!prefetched);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(prefetched?.hasMore ?? true);
  const { showLoading, hideLoading } = useLoading();
  const filters = useArticleFilters({
    categories,
    tags,
    initial: prefetched && {
      category: prefetched.category ?? null,
      tag: prefetched.tag ?? null,
      search: prefetched.search ?? null,
    },
  });
  const hotArticles = useMemo(() => getHotArticles(articles, 10), [articles]);

  // 预取数据已覆盖首屏（含同筛选条件），跳过挂载后的首次客户端拉取
  const skipInitialFetch = useRef(Boolean(prefetched));

  const fetchInitialData = useCallback(async () => {
    try {
      logger.log('开始获取文章数据...');
      setLoading(true);
      setError(null);
      showLoading();

      // 并行请求所有数据，减少等待时间
      const [articlesData, categoriesData, tagsData] = await Promise.all([
        getArticles({
          category: filters.selectedCategory || undefined,
          tag: filters.selectedTag || undefined,
          search: filters.searchQuery || undefined,
          limit: ARTICLES_PER_PAGE,
          offset: 0,
        }),
        getCategories(),
        getTags(),
      ]);

      setArticles(articlesData);
      setCategories(categoriesData);
      setTags(tagsData);
      setHasMore(articlesData.length >= ARTICLES_PER_PAGE);
      setPage(1);
    } catch (err) {
      logger.error('获取数据失败:', err);
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      hideLoading();
      setLoading(false);
    }
  }, [filters.selectedCategory, filters.selectedTag, filters.searchQuery, showLoading, hideLoading]);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    fetchInitialData();
  }, [fetchInitialData]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) {
      return;
    }
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const articlesData = await getArticles({
        category: filters.selectedCategory || undefined,
        tag: filters.selectedTag || undefined,
        search: filters.searchQuery || undefined,
        limit: ARTICLES_PER_PAGE,
        offset: (nextPage - 1) * ARTICLES_PER_PAGE,
      });
      setArticles(prev => [...prev, ...articlesData]);
      setPage(nextPage);
      setHasMore(articlesData.length >= ARTICLES_PER_PAGE);
    } catch (err) {
      logger.error('加载更多失败:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, filters.selectedCategory, filters.selectedTag, filters.searchQuery]);

  const observerTargetRef = useInfiniteScroll({
    loading: loadingMore,
    hasMore,
    onLoadMore: loadMore,
  });

  const hasFilters = Boolean(
    filters.selectedCategory || filters.selectedTag || filters.searchQuery
  );

  // 筛选结果变化时重挂载入场，避免 popLayout 跳动
  const filterKey = `${filters.selectedCategory ?? ''}|${filters.selectedTag ?? ''}|${filters.searchQuery}`;

  return (
    <div className="min-h-screen text-foreground font-sans selection:bg-primary/40 selection:text-primary-foreground">
      <div className="container mx-auto px-4 pt-24">
        <FilterBar
          onSearchChange={filters.handleSearchChange}
          viewMode={viewMode}
          onViewToggle={setViewMode}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
      </div>

      {/* 两列布局：左侧文章区，右侧边栏（统计/分类/标签/热门） */}
      <div className="container mx-auto px-4 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
          {/* 左列：文章区 */}
          <div className="min-w-0">
            {error ? (
              <FadeIn>
                <div className="text-center py-20">
                  <div className="text-4xl font-bold mb-4 text-destructive">加载失败</div>
                  <p className="text-lg mb-6 text-muted-foreground">{error}</p>
                  <button
                    onClick={() => fetchInitialData()}
                    className="px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    重新加载
                  </button>
                </div>
              </FadeIn>
            ) : loading ? (
              /* 骨架屏与真实布局严格同构（减少 CLS） */
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ArticleCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="glass-card flex gap-4 p-4 animate-pulse" aria-hidden>
                      <div className="w-28 sm:w-44 aspect-[4/3] rounded-xl bg-glass/40" />
                      <div className="flex-1 space-y-3 py-1">
                        <div className="h-4 w-1/4 bg-glass/40 rounded" />
                        <div className="h-5 w-3/4 bg-glass/40 rounded" />
                        <div className="h-4 w-full bg-glass/30 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : articles.length > 0 ? (
              <>
                {viewMode === 'grid' ? (
                  <Stagger
                    key={filterKey}
                    className="grid grid-cols-1 xl:grid-cols-2 gap-6"
                    itemCount={articles.length}
                  >
                    {articles.map((article) => (
                      <StaggerItem key={article.id}>
                        <ArticleCard {...toCardProps(article)} />
                      </StaggerItem>
                    ))}
                  </Stagger>
                ) : (
                  <Stagger key={filterKey} className="space-y-4" itemCount={articles.length}>
                    {articles.map((article) => (
                      <StaggerItem key={article.id}>
                        <ArticleListItem article={article} />
                      </StaggerItem>
                    ))}
                  </Stagger>
                )}

                {/* 无限滚动哨兵 + 终态提示（替代原加载更多按钮） */}
                <div ref={observerTargetRef} className="py-10 text-center">
                  {loadingMore ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader />
                      <span className="text-sm text-muted-foreground">加载更多…</span>
                    </div>
                  ) : !hasMore ? (
                    <p className="text-sm text-muted-foreground">
                      — 已加载全部 {articles.length} 篇 —
                    </p>
                  ) : null}
                </div>
              </>
            ) : (
              <EmptyState
                icon={BookOpen}
                variant={hasFilters ? 'search' : 'default'}
                title={hasFilters ? '未找到匹配文章' : '暂无文章'}
                description={
                  hasFilters
                    ? '没有找到匹配的文章，请尝试其他筛选条件'
                    : '暂无文章发布，请稍后再来'
                }
                // 仅无筛选的「真·空库」用本地 Lottie 试点；筛选空结果保持简洁图标
                lottieSrc={hasFilters ? undefined : '/lottie/empty-inbox.json'}
                action={
                  hasFilters
                    ? { label: '清除筛选', onClick: filters.resetFilters }
                    : { label: '返回首页', href: '/' }
                }
              />
            )}
          </div>

          {/* 右列：边栏（移动端折叠到文章区下方） */}
          <div className="lg:sticky lg:top-24">
            <ArticleSidebar
              categories={categories}
              tags={tags}
              articles={articles}
              selectedCategory={filters.selectedCategory}
              selectedTag={filters.selectedTag}
              onCategorySelect={filters.handleCategoryChange}
              onTagSelect={filters.handleTagChange}
            />
          </div>
        </div>
      </div>

      <ArchiveDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
        tags={tags}
        hotArticles={hotArticles}
        onCategorySelect={filters.handleCategoryChange}
        onTagSelect={filters.handleTagChange}
      />
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
          aria-hidden
        />
      )}
    </div>
  );
}

export default function ArticlesPageClient({
  prefetched,
}: {
  prefetched?: PrefetchedArticlesData;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-foreground">加载中...</div>}>
      <ArticlesPageContent prefetched={prefetched} />
    </Suspense>
  );
}
