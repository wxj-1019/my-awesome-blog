'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import { CalendarIcon, ArrowRightIcon, Heart, MessageCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ArticleCardProps {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime?: string;
  category?: string;
  href?: string;
  className?: string;
  showCategory?: boolean;
  showMeta?: boolean;
  coverImage?: string;
  likes?: number;
  comments?: number;
  style?: React.CSSProperties;
}

export default function ArticleCard({
  id,
  title,
  excerpt,
  date,
  readTime,
  category,
  href,
  className,
  showCategory = true,
  showMeta = true,
  coverImage,
  likes = 0,
  comments = 0,
  style,
}: ArticleCardProps) {
  const glassCardClass = 'glass-card';

  // 设置默认封面图片
  const [imgSrc, setImgSrc] = React.useState(coverImage || '/assets/avatar.jpg');

  // 图片加载失败时的回调函数
  const handleError = () => {
    setImgSrc('/assets/avatar.jpg');
  };

  // 当 coverImage 发生变化时，更新 imgSrc
  React.useEffect(() => {
    setImgSrc(coverImage || '/assets/avatar.jpg');
  }, [coverImage]);

  const targetHref = href || `/posts/${id}`;

  return (
    <Link
      href={targetHref as Route}
      className={cn(
        `${glassCardClass} group overflow-hidden h-full flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`,
        className
      )}
      aria-labelledby={`post-title-${id}`}
      style={style}
    >
      {/* 封面图片区域 */}
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={imgSrc}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={handleError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-tech-darkblue/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2
              id={`post-title-${id}`}
              className="text-lg sm:text-xl font-bold mb-2 text-foreground group-hover:text-tech-cyan transition-colors break-words"
            >
              {title}
            </h2>
            <p className="text-muted-foreground mb-3 sm:mb-4 line-clamp-2 text-sm sm:text-base">
              {excerpt}
            </p>
            {showMeta && (
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1" aria-label={`发布日期：${date}`}>
                  <CalendarIcon className="w-4 h-4" />
                  <time>{date}</time>
                </div>
                {readTime && (
                  <div className="flex items-center gap-1" aria-label={`阅读时间：${readTime}`}>
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    <span>{readTime}</span>
                  </div>
                )}
                <div className="flex items-center gap-1" aria-label={`点赞数：${likes}`}>
                  <Heart className="w-4 h-4" aria-hidden="true" />
                  <span>{likes}</span>
                </div>
                <div className="flex items-center gap-1" aria-label={`评论数：${comments}`}>
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  <span>{comments}</span>
                </div>
                {showCategory && category && (
                  <span className="px-2 sm:px-3 py-1 rounded-full bg-tech-cyan/20 text-tech-cyan text-xs font-medium">
                    {category}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <div
              className="w-10 h-10 rounded-full bg-tech-cyan/20 flex items-center justify-center group-hover:bg-tech-cyan transition-colors"
              aria-hidden="true"
            >
              <ArrowRightIcon
                className="w-5 h-5 text-tech-cyan group-hover:text-white transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ArticleCard Skeleton Component for Loading State
export function ArticleCardSkeleton() {
  return (
    <div
      className="glass-card overflow-hidden h-full flex flex-col animate-pulse"
      role="status"
      aria-label="加载中"
      aria-busy="true"
    >
      <div className="relative aspect-video bg-glass/20" />

      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div
              className="h-5 w-3/4 bg-glass/40 rounded mb-2"
              aria-hidden="true"
            />
            <div
              className="h-4 w-full bg-glass/30 rounded mb-3"
              aria-hidden="true"
            />
            <div
              className="h-4 w-5/6 bg-glass/30 rounded mb-3"
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div
                className="h-4 w-16 bg-glass/30 rounded"
                aria-hidden="true"
              />
              <div
                className="h-4 w-16 bg-glass/30 rounded"
                aria-hidden="true"
              />
              <div
                className="h-4 w-16 bg-glass/30 rounded"
                aria-hidden="true"
              />
              <div
                className="h-6 w-16 bg-tech-cyan/20 rounded-full"
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="flex-shrink-0">
            <div
              className="w-10 h-10 rounded-full bg-tech-cyan/20"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
