'use client';

import { FileText, MessageCircle, Eye, Calendar, TrendingUp } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { UserStats } from '@/types';

interface StatsGridProps {
  stats: UserStats;
  loading?: boolean;
}

export default function StatsGrid({ stats, loading }: StatsGridProps) {
  // 格式化日期
  const formatDate = (dateString?: string): string => {
    if (!dateString) {return 'N/A';}
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <GlassCard padding="lg" className="border-tech-cyan/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 骨架屏：列表为占位符，使用 index 作为 key 即可 */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-tech-cyan/20 mb-2 mx-auto"></div>
              <div className="h-4 bg-tech-cyan/10 rounded mx-auto w-16 mb-1"></div>
              <div className="h-3 bg-tech-cyan/10 rounded mx-auto w-12"></div>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  const statsData = [
    {
      label: '文章',
      value: stats.article_count,
      icon: FileText,
      color: 'tech-cyan',
      bgColor: 'bg-tech-cyan/20'
    },
    {
      label: '评论',
      value: stats.comment_count,
      icon: MessageCircle,
      color: 'tech-cyan',
      bgColor: 'bg-tech-cyan/20'
    },
    {
      label: '访问量',
      value: stats.total_views || 0,
      icon: Eye,
      color: 'tech-cyan',
      bgColor: 'bg-tech-cyan/20'
    },
    {
      label: '加入时间',
      value: formatDate(stats.joined_date).includes('N/A') ? 'N/A' : formatDate(stats.joined_date).split('年')[0],
      icon: Calendar,
      color: 'tech-cyan',
      bgColor: 'bg-tech-cyan/20',
      isDate: true
    }
  ];

  return (
    <GlassCard
      padding="lg"
      className="border-tech-cyan/20 hover:shadow-[var(--glass-shadow)] transition-[colors,box-shadow] duration-300"
    >
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-tech-cyan" />
        <h3 className="text-lg font-bold text-foreground">数据统计</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <div
            key={stat.label}
            className="group relative p-4 rounded-xl bg-[var(--card)]/40 hover:bg-tech-cyan/10 transition-[colors,transform] duration-300 hover:scale-[1.01] cursor-pointer"
          >
            {/* 渐变边框效果 */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-tech-cyan/0 via-tech-cyan/0 to-tech-cyan/0 group-hover:via-tech-cyan/10 transition-[colors,transform] duration-500 pointer-events-none" />

            {/* 图标 */}
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-5 h-5 text-${stat.color}`} />
            </div>

            {/* 数值：纯数字走 AnimatedNumber 滚动；年份/N-A 文本保持原样 */}
            <div className="text-center">
              {typeof stat.value === 'number' ? (
                <AnimatedNumber
                  value={stat.value}
                  className={`block text-2xl font-bold text-${stat.color} mb-1 group-hover:text-tech-cyan transition-colors tabular-nums`}
                />
              ) : (
                <div className={`text-2xl font-bold text-${stat.color} mb-1 group-hover:text-tech-cyan transition-colors`}>
                  {stat.value}
                </div>
              )}
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
