'use client';

import { Award, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import type { Article } from '@/types';

interface ArticleAuthorPanelProps {
  /** 文章作者信息 */
  author: Article['author'];
  /** 当前用户是否已关注该作者 */
  isFollowing: boolean;
  /** 关注/取消关注回调 */
  onFollow: () => void;
  className?: string;
}

/**
 * 文章末尾作者面板：头像、名称、简介、声誉、关注者、关注按钮
 * 使用语义 token，不硬编码颜色
 */
export default function ArticleAuthorPanel({
  author,
  isFollowing,
  onFollow,
  className,
}: ArticleAuthorPanelProps) {
  const reputation = author.reputation ?? 0;
  const followersCount = author.followers_count ?? 0;

  return (
    <GlassCard padding="none" className={cn('p-6 shadow-none', className)}>
      <div className="flex flex-col md:flex-row items-start">
        {/* 头像 */}
        <div className="mr-4 mb-4 md:mb-0 shrink-0">
          {author.avatar ? (
            /* 作者头像来源可能为外部域名，无法统一加入 next.config remotePatterns，保留 <img> */
            <img
              src={author.avatar}
              alt={`${author.username} 的头像`}
              className="w-16 h-16 rounded-xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-primary/15 text-primary flex items-center justify-center text-2xl font-bold">
              {author.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* 信息区 */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">
              {author.username}
            </h2>
            <Button
              variant={isFollowing ? 'default' : 'outline'}
              size="sm"
              onClick={onFollow}
              aria-label={
                isFollowing
                  ? `取消关注${author.username}`
                  : `关注${author.username}`
              }
              className="min-h-11"
            >
              {isFollowing ? '已关注' : '关注'}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-1">
            {author.bio || '暂无个人简介'}
          </p>

          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Award className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>{reputation} 声誉</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>{followersCount} 关注者</span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
