'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from '@/lib/framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Calendar,
  Clock,
  Eye,
  User,
  ThumbsUp,
  Bookmark,
} from 'lucide-react';
import { BlurIn, FadeIn, HoverLift } from '@/components/motion';
import SocialShare from '@/components/social/SocialShare';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { env } from '@/lib/env';
import type { Article } from '@/types';
import { cn } from '@/lib/utils';

interface ArticleHeroStageProps {
  article: Article;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
  formatDate: (date: string) => string;
  textClass: string;
  /** 可选顶部媒体区（封面/视频） */
  mediaSlot?: React.ReactNode;
}

/**
 * 章节舞台：标题 layoutId + BlurIn、meta FadeIn、桌面轻视差仅作用在媒体层
 */
export default function ArticleHeroStage({
  article,
  isLiked,
  isBookmarked,
  onLike,
  onBookmark,
  formatDate,
  textClass,
  mediaSlot,
}: ArticleHeroStageProps) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);
  const progress = useScrollProgress(mediaRef, {
    offsetStart: 0,
    offsetEnd: 0.5,
  });

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // 仅桌面、未减动效时做极轻位移（媒体节点专用，不与 Framer 叠）
  const parallaxY =
    !reduced && isDesktop ? Math.min(progress, 1) * 24 : 0;
  const parallaxScale =
    !reduced && isDesktop ? 1 + Math.min(progress, 1) * 0.04 : 1;

  return (
    <header className="mb-8">
      {mediaSlot ? (
        <div
          ref={mediaRef}
          className="h-[28vh] md:h-[32vh] overflow-hidden relative z-10 mb-8 rounded-none md:rounded-xl"
        >
          <div
            className="h-full w-full will-change-transform"
            style={{
              transform: `translate3d(0, ${parallaxY}px, 0) scale(${parallaxScale})`,
            }}
          >
            {mediaSlot}
          </div>
        </div>
      ) : null}

      <div className="px-4 md:px-0">
        <FadeIn className="flex flex-wrap items-center gap-4 mb-4">
          {article.category && (
            <Badge
              variant="secondary"
              className="bg-primary/20 text-primary"
            >
              {article.category.name}
            </Badge>
          )}
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            <span>{article.read_time} 分钟阅读</span>
          </div>
        </FadeIn>

        <BlurIn>
          <motion.h1
            layoutId={`article-title-${article.id}`}
            className={cn(
              'text-3xl md:text-4xl font-bold mb-4 font-display',
              textClass
            )}
          >
            {article.title}
          </motion.h1>
        </BlurIn>

        <FadeIn delay={0.05}>
          <div className="flex flex-wrap items-center justify-between pb-6 border-b border-dashed border-opacity-30 gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center text-sm">
                <User className="h-4 w-4 mr-2" />
                <span>{article.author.username}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{formatDate(article.published_at)}</span>
              </div>
              <div className="flex items-center text-sm">
                <Eye className="h-4 w-4 mr-2" />
                <span>{article.view_count} 次阅读</span>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <HoverLift>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLike}
                  className={cn(
                    'flex items-center',
                    isLiked ? 'text-red-500' : '',
                    'border-border hover:bg-muted/40 text-foreground'
                  )}
                >
                  <ThumbsUp
                    className={cn('h-4 w-4 mr-2', isLiked && 'fill-current')}
                  />
                  {isLiked ? '已点赞' : '点赞'}
                  <span className="ml-1">({article.likes_count})</span>
                </Button>
              </HoverLift>
              <HoverLift>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBookmark}
                  className={cn(
                    'flex items-center',
                    isBookmarked ? 'text-yellow-500' : '',
                    'border-border hover:bg-muted/40 text-foreground'
                  )}
                >
                  <Bookmark
                    className={cn(
                      'h-4 w-4 mr-2',
                      isBookmarked && 'fill-current'
                    )}
                  />
                  {isBookmarked ? '已收藏' : '收藏'}
                </Button>
              </HoverLift>
              <SocialShare
                url={`${env.NEXT_PUBLIC_SITE_URL}/articles/${article.id}`}
                title={article.title}
                description={article.excerpt}
              />
            </div>
          </div>
        </FadeIn>
      </div>
    </header>
  );
}
