'use client';

import { FileText, Eye, Heart, MessageCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import { memo } from 'react';

interface MiniStatsProps {
  articleCount: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
}

function MiniStats({
  articleCount,
  totalViews,
  totalLikes,
  totalComments,
}: MiniStatsProps) {
  const { themedClasses } = useThemedClasses();

  const mutedTextClass = themedClasses.mutedTextClass;

  const stats = [
    {
      icon: FileText,
      label: '文章',
      value: articleCount,
      color: 'text-tech-cyan',
    },
    {
      icon: Eye,
      label: '阅读',
      value: totalViews,
      color: 'text-green-500',
    },
    {
      icon: Heart,
      label: '点赞',
      value: totalLikes,
      color: 'text-red-500',
    },
    {
      icon: MessageCircle,
      label: '评论',
      value: totalComments,
      color: 'text-blue-500',
    },
  ];

  return (
    <GlassCard padding="sm">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:scale-105"
          >
            <div className={`p-1.5 rounded-lg bg-tech-cyan/10`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-lg font-bold text-foreground truncate`}>
                {stat.value.toLocaleString()}
              </p>
              <p className={`text-xs ${mutedTextClass}`}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export default memo(MiniStats);
