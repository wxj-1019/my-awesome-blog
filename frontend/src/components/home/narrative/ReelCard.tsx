'use client';

import Link from 'next/link';
import type { Route } from 'next';
import {
  Eye,
  Heart,
  MessageCircle,
  Pin,
  Sparkles,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ReelHighlightType = 'pinned' | 'featured' | 'trending' | 'latest';

export interface ReelHighlightItem {
  id: string;
  type: ReelHighlightType;
  title: string;
  description: string;
  link: string;
  badge: string;
  color: string;
  stats: {
    views?: number;
    likes?: number;
    comments?: number;
  };
  category?: string;
  readTime?: string;
}

export const REEL_TYPE_META: Record<
  ReelHighlightType,
  { badge: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pinned: {
    badge: '置顶',
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
    icon: Pin,
  },
  featured: {
    badge: '精选',
    color: 'from-tech-cyan/20 to-tech-sky/10 border-tech-cyan/30',
    icon: Sparkles,
  },
  trending: {
    badge: '热门',
    color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30',
    icon: TrendingUp,
  },
  latest: {
    badge: '最新',
    color: 'from-violet-500/20 to-purple-500/10 border-violet-500/30',
    icon: Clock,
  },
};

export interface ReelCardProps {
  item: ReelHighlightItem;
  /** 是否为当前焦点卡 */
  focused?: boolean;
  /** 拖拽中禁止导航 */
  suppressClick?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 胶片单格：语义玻璃卡 + 统计行。
 */
export default function ReelCard({
  item,
  focused = false,
  suppressClick = false,
  className,
  style,
}: ReelCardProps) {
  const Icon = REEL_TYPE_META[item.type].icon;

  return (
    <Link
      href={item.link as Route}
      data-testid={focused ? 'featured-hero-card' : 'featured-reel-card'}
      data-focused={focused ? 'true' : 'false'}
      draggable={false}
      onClick={(e) => {
        if (suppressClick) {
          e.preventDefault();
        }
      }}
      className={cn(
        'block h-full rounded-2xl border bg-gradient-to-br p-5 sm:p-6',
        'border-glass-border bg-glass/25 backdrop-blur-xl',
        'transition-[box-shadow,border-color] duration-300',
        focused
          ? 'border-primary/50 shadow-[0_0_40px_color-mix(in_oklab,var(--primary)_18%,transparent)]'
          : 'hover:border-primary/35',
        item.color,
        className
      )}
      style={style}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
          <Icon className="w-3 h-3" aria-hidden />
          {item.badge}
        </span>
        {item.category ? (
          <span className="text-xs text-muted-foreground truncate">{item.category}</span>
        ) : null}
      </div>
      <h3
        className={cn(
          'font-bold text-foreground mb-2 line-clamp-2',
          focused ? 'text-lg sm:text-2xl' : 'text-base sm:text-lg'
        )}
      >
        {item.title}
      </h3>
      <p
        className={cn(
          'text-sm text-muted-foreground mb-4',
          focused ? 'line-clamp-3' : 'line-clamp-2'
        )}
      >
        {item.description}
      </p>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {item.stats.views !== undefined && (
          <span className="inline-flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" aria-hidden />
            {item.stats.views}
          </span>
        )}
        {item.stats.likes !== undefined && (
          <span className="inline-flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" aria-hidden />
            {item.stats.likes}
          </span>
        )}
        {item.stats.comments !== undefined && (
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" aria-hidden />
            {item.stats.comments}
          </span>
        )}
        {item.readTime ? <span>{item.readTime}</span> : null}
      </div>
    </Link>
  );
}
