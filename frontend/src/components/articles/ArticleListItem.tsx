'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import { Calendar, Clock, Eye, Heart, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Article } from '@/types';

export interface ArticleListItemProps {
  article: Article;
  className?: string;
}

/**
 * 文章横向列表卡（list 视图专用）：左封面缩略 + 右标题/摘要/元信息。
 * 整卡 Link 直达文章详情，替代原 HoloCard 的弹层交互。
 */
function ArticleListItem({ article, className }: ArticleListItemProps) {
  const cover = article.cover_image || '/covers/default-cover.svg';
  const dateText = article.published_at
    ? new Date(article.published_at).toLocaleDateString('zh-CN')
    : '';

  return (
    <Link
      href={`/articles/${article.id}` as Route}
      className={cn(
        'glass-card group flex gap-4 sm:gap-5 overflow-hidden p-3 sm:p-4',
        'transition-[colors,transform] duration-300 hover:-translate-y-1 hover:shadow-xl',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      aria-labelledby={`article-list-item-${article.id}`}
    >
      {/* 封面缩略 */}
      <div className="relative w-28 sm:w-44 aspect-[4/3] flex-shrink-0 rounded-xl overflow-hidden">
        <Image
          src={cover}
          alt={article.title}
          fill
          sizes="(max-width: 640px) 112px, 176px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* 内容区 */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {article.categories?.[0] && (
              <span className="px-2 py-0.5 rounded-full bg-tech-cyan/20 text-tech-cyan text-[11px] font-medium">
                {article.categories[0].name}
              </span>
            )}
            {dateText && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="w-3 h-3" aria-hidden />
                <time>{dateText}</time>
              </span>
            )}
          </div>
          <h3
            id={`article-list-item-${article.id}`}
            className="text-base sm:text-lg font-bold text-foreground line-clamp-1 group-hover:text-tech-cyan transition-colors"
          >
            {article.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2 hidden sm:block">
            {article.excerpt}
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" aria-hidden />
              {article.view_count}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" aria-hidden />
              {article.likes_count}
            </span>
            {article.read_time ? (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" aria-hidden />
                {article.read_time} min
              </span>
            ) : null}
          </div>
          <ArrowRight
            className="w-4 h-4 flex-shrink-0 text-muted-foreground transition-[colors,transform] group-hover:translate-x-1 group-hover:text-tech-cyan"
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
}

const ArticleListItemWithMemo = memo(ArticleListItem);
ArticleListItemWithMemo.displayName = 'ArticleListItem';

export default ArticleListItemWithMemo;
