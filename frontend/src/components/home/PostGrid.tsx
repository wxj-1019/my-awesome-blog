'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import type { Post } from '@/types';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import SimplePostCard, { SimplePostCardSkeleton } from '@/components/blog/SimplePostCard';
import { useTheme } from '@/context/theme-context';
import { useLoading } from '@/context/loading-context';

interface PostCardItemProps {
  post: Post;
  index: number;
}

interface PostCardItemWithThemeProps extends PostCardItemProps {
  glassCardClass: string;
}

const PostCardItemWithTheme = React.memo(({ post, index, glassCardClass }: PostCardItemWithThemeProps) => (
  <SimplePostCard
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { showLoading, hideLoading } = useLoading();

  // 防止 hydration 错误
  useEffect(() => {
    setMounted(true);
  }, []);

  const glassCardClass = mounted && resolvedTheme === 'dark'
    ? 'glass-card'
    : 'bg-muted/80 shadow-lg border border-border';

  const [page, setPage] = useState(1);
  const [hasMoreLocal, setHasMoreLocal] = useState(hasMore);
  const [loadingLocal, setLoadingLocal] = useState(loading);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const observerRef = useRef<IntersectionObserver>();

  const loadMore = useCallback(async () => {
    if (loadingLocal || !hasMoreLocal || !onLoadMore) return;

    showLoading();
    setLoadingLocal(true);
    onLoadMore();

    // 模拟加载数据
    setTimeout(() => {
      hideLoading();
      setLoadingLocal(false);
      setPage(prev => prev + 1);
    }, 1000);
  }, [loadingLocal, hasMoreLocal, onLoadMore, showLoading, hideLoading]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreLocal && !loadingLocal) {
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
  }, [loadMore, hasMoreLocal, loadingLocal]);

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
              <SimplePostCardSkeleton key={`skeleton-${index}`} />
            ))
          ) : (
            posts.map((post, index) => (
              <PostCardItemWithTheme key={post.id} post={post} index={index} glassCardClass={glassCardClass} />
            ))
          )}
        </div>

        {(hasMoreLocal || loadingLocal) && (
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
