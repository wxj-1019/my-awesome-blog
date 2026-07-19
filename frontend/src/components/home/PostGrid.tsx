'use client';

import type { Post } from '@/types';
import React, { useState, useCallback, useEffect } from 'react';
import ArticleCard, { ArticleCardSkeleton } from '@/components/ui/ArticleCard';
import { useLoading } from '@/context/loading-context';

interface PostCardItemProps {
  post: Post;
  index: number;
}

interface PostCardItemWithThemeProps extends PostCardItemProps {
  glassCardClass: string;
}

const PostCardItemWithTheme = React.memo(({ post, index, glassCardClass }: PostCardItemWithThemeProps) => (
  <ArticleCard
    key={post.id}
    id={post.id}
    title={post.title}
    excerpt={post.excerpt}
    date={post.date}
    readTime={post.readTime}
    category={post.category}
    coverImage={post.image} // 传递封面图
    likes={post.likes}
    comments={post.comments}
    href={`/posts/${post.id}`}
    className={`animate-fade-scale-up ${glassCardClass}`}
    style={{ animationDelay: `${Math.min(index * 50, 200)}ms` }}
  />
));

PostCardItemWithTheme.displayName = 'PostCardItemWithTheme';

interface PostGridProps {
  posts: Post[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export default function PostGrid({ posts, loading = false, hasMore = true, onLoadMore }: PostGridProps) {
  const { showLoading, hideLoading } = useLoading();

  // 语义 token：light/dark 由 CSS 变量区分
  const glassCardClass =
    'bg-card/90 backdrop-blur-xl shadow-lg border border-border';

  const [loadingLocal, setLoadingLocal] = useState(loading);

  const loadMore = useCallback(async () => {
    if (loadingLocal || !hasMore || !onLoadMore) {return;}

    showLoading();
    setLoadingLocal(true);
    onLoadMore();

    // 模拟加载数据
    setTimeout(() => {
      hideLoading();
      setLoadingLocal(false);
    }, 1000);
  }, [loadingLocal, hasMore, onLoadMore, showLoading, hideLoading]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingLocal) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, loadingLocal]);

  // 根据加载状态决定是否显示骨架屏
  const shouldShowSkeleton = loadingLocal && posts.length === 0;

  return (
    <section className="py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12 animate-fade-in-up">
          最新文章
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {shouldShowSkeleton ? (
            // 显示骨架屏
            Array.from({ length: 6 }).map((_, index) => (
              <ArticleCardSkeleton key={`skeleton-${index}`} />
            ))
          ) : (
            posts.map((post, index) => (
              <PostCardItemWithTheme key={post.id} post={post} index={index} glassCardClass={glassCardClass} />
            ))
          )}
        </div>

        {(hasMore || loadingLocal) && (
          <div id="sentinel" className="flex justify-center py-8">
            {loadingLocal && posts.length > 0 && (
              <div className="h-12 w-12 border-4 border-tech-cyan border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
