'use client';

import { Tag, ThumbsUp, MessageSquare, Share2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Article } from '@/types';

interface ArticleReadingMetaBarProps {
  /** 文章阅读相关字段 */
  article: Pick<
    Article,
    'tags' | 'likes_count' | 'comments_count' | 'shares_count' | 'view_count'
  >;
  className?: string;
}

/** 统计项配置 */
const statItems = [
  {
    key: 'likes',
    icon: ThumbsUp,
    label: '点赞数',
    valueKey: 'likes_count' as const,
  },
  {
    key: 'comments',
    icon: MessageSquare,
    label: '评论数',
    valueKey: 'comments_count' as const,
  },
  {
    key: 'shares',
    icon: Share2,
    label: '分享数',
    valueKey: 'shares_count' as const,
  },
  {
    key: 'views',
    icon: Eye,
    label: '阅读量',
    valueKey: 'view_count' as const,
  },
];

/**
 * 文章阅读数据栏：标签 + 点赞/评论/分享/阅读量统计
 * 使用语义 token，不硬编码颜色
 */
export default function ArticleReadingMetaBar({
  article,
  className,
}: ArticleReadingMetaBarProps) {
  return (
    <section
      aria-label="文章阅读数据"
      className={cn('py-5 border-y border-border/70', className)}
    >
      {/* 标签 */}
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full text-primary bg-primary/10"
            >
              <Tag className="h-3 w-3" aria-hidden="true" />
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* 统计数据 */}
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map(({ key, icon: Icon, label, valueKey }) => (
          <div
            key={key}
            className="flex items-center gap-2"
            aria-label={`${label}：${article[valueKey]}`}
          >
            <dt className="sr-only">{label}</dt>
            <dd className="flex items-center gap-2">
              <Icon
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-lg font-semibold text-foreground">
                {article[valueKey]}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
