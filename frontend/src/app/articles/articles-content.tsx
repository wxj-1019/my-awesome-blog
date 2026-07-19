'use client';
import { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { getArticles, getCategories, getTags, getFeaturedArticles } from '@/services/articleService';
import { useLoading } from '@/context/loading-context';
import HoloCard from '@/components/articles/HoloCard';
import CommandBar from '@/components/articles/CommandBar';
import ArchiveDrawer from '@/components/articles/ArchiveDrawer';
import Loader from '@/components/loading/Loader';
import GlitchText from '@/components/ui/GlitchText';
import { FocusCards } from '@/components/ui/FocusCards';
import ArticleCardSkeleton from '@/components/articles/ArticleCardSkeleton';
import { BlurIn, FadeIn } from '@/components/motion';
import {  Article, Category, Tag } from '@/types';
import logger from '@/utils/logger';
import { mapArticlesToAlbums, getHotArticles } from '@/utils/articleHelpers';
import { useArticleFilters } from '@/hooks/useArticleFilters';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
const ARTICLES_PER_PAGE = 12;
function ArticlesPageContent() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { showLoading, hideLoading } = useLoading();
  const filters = useArticleFilters({ categories, tags });
  const hotArticles = useMemo(() => getHotArticles(articles, 10), [articles]);
  const featuredAlbums = useMemo(() => mapArticlesToAlbums(featuredArticles), [featuredArticles]);
  const featuredArticleCount = featuredArticles.length;
  const fetchInitialData = useCallback(async () => {
    try {
      logger.log('开始获取文章数据...');
      setLoading(true);
      setError(null);
      showLoading();

      // 并行请求所有数据，减少等待时间
      const [articlesData, categoriesData, tagsData, featuredData] = await Promise.all([
        getArticles({
          category: filters.selectedCategory || undefined,
          tag: filters.selectedTag || undefined,
          search: filters.searchQuery || undefined,
          limit: ARTICLES_PER_PAGE,
          offset: 0,
        }),
        getCategories(),
        getTags(),
        getFeaturedArticles(5),
      ]);

      logger.log('获取到文章数据:', articlesData);
      setArticles(articlesData);
      logger.log('获取到分类数据:', categoriesData);
      setCategories(categoriesData);
      logger.log('获取到标签数据:', tagsData);
      setTags(tagsData);
      logger.log('获取到精选文章数据:', featuredData);
      setFeaturedArticles(featuredData || []);
      setHasMore(articlesData.length >= ARTICLES_PER_PAGE);
      setPage(1);
    } catch (error) {
      logger.error('获取数据失败:', error);
      setError(error instanceof Error ? error.message : '获取数据失败');
    } finally {
      hideLoading();
      setLoading(false);
    }
  }, [filters.selectedCategory, filters.selectedTag, filters.searchQuery, showLoading, hideLoading]);
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);
  const loadMore = useCallback(async () => {
    if (!loadingMore && hasMore) {
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
      } catch (error) {
        logger.error('加载更多失败:', error);
      } finally {
        setLoadingMore(false);
      }
    }
  }, [loadingMore, hasMore, page, filters.selectedCategory, filters.selectedTag, filters.searchQuery]);
  const observerTargetRef = useInfiniteScroll({
    loading: loadingMore,
    hasMore,
    onLoadMore: loadMore
  });
  const handleViewToggle = useCallback((view: 'grid' | 'list') => {
    setViewMode(view);
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/40 selection:text-primary-foreground">
      <div className="relative">
        <BlurIn>
          <div className="pt-20 pb-10 text-center">
            <GlitchText text="ARTICLES" size="lg" className="mb-4 font-display" />
            <p className="text-gray-400 font-mono text-sm tracking-widest uppercase">
              Explore digital frontier
            </p>
          </div>
        </BlurIn>
        {featuredArticleCount > 0 && (
          <FadeIn className="mb-16">
            <FocusCards cards={featuredAlbums} />
          </FadeIn>
        )}
        <div className="container mx-auto px-4 py-8 pb-32">
          <FadeIn delay={0.05}>
            <CommandBar
              categories={categories}
              tags={tags}
              onCategoryChange={filters.handleCategoryChange}
              onTagChange={filters.handleTagChange}
              onSearchChange={filters.handleSearchChange}
              onViewToggle={handleViewToggle}
              currentView={viewMode}
              onOpenDrawer={() => setDrawerOpen(true)}
            />
          </FadeIn>
          <div className="mt-8">
            {error ? (
              <FadeIn>
                <div className="text-center py-20">
                  <div className="text-4xl font-bold mb-4 text-destructive">
                    加载失败
                  </div>
                  <p className="text-lg mb-6 text-muted-foreground">
                    {error}
                  </p>
                  <button
                    onClick={() => fetchInitialData()}
                    className="px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    重新加载
                  </button>
                </div>
              </FadeIn>
            ) : loading ? (
              <div className={viewMode === 'grid'
                ? 'columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6'
                : 'space-y-6'
              }>
                {/* 骨架屏占位符：使用 index 作为 key */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <ArticleCardSkeleton key={i} variant={i % 3 === 0 ? 'tall' : i % 3 === 1 ? 'short' : 'default'} />
                ))}
              </div>
            ) : articles.length > 0 ? (
              <>
                <FadeIn>
                  <div
                    className={viewMode === 'grid'
                      ? 'columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6'
                      : 'space-y-6'
                    }
                  >
                    <AnimatePresence mode="popLayout">
                      {articles.map((article) => (
                        <motion.div
                          key={article.id}
                          layout
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.25 }}
                          className="break-inside-avoid mb-6"
                        >
                          <HoloCard
                            article={article}
                            isFeatured={false}
                            className="w-full"
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </FadeIn>
                {hasMore && (
                  <div ref={observerTargetRef} className="py-8 text-center">
                    {loadingMore ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader />
                        <span className="text-sm text-gray-400">加载更多...</span>
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={loadMore}
                        className="px-8 py-4 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        加载更多 ({articles.length})
                      </motion.button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="text-4xl font-bold mb-4 text-primary">
                  暂无文章
                </div>
                <p className="text-lg text-muted-foreground">
                  {filters.selectedCategory || filters.selectedTag || filters.searchQuery
                    ? '没有找到匹配的文章，请尝试其他筛选条件'
                    : '暂无文章发布，请稍后再来'}
                </p>
              </motion.div>
            )}
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
        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
export default function ArticlesPageClient() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">加载中...</div>}>
      <ArticlesPageContent />
    </Suspense>
  );
}
