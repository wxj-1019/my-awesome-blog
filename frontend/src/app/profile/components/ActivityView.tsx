'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, MessageCircle, Heart, Eye, ExternalLink } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { useLoading } from '@/context/loading-context';

interface ActivityItem {
  id: string;
  type: 'post' | 'comment' | 'like' | 'follow';
  title: string;
  description: string;
  timestamp: string;
  postId?: string;
}

export default function ActivityView() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    // 模拟加载活动数据
    showLoading();
    setTimeout(() => {
      setActivities([
        {
          id: '1',
          type: 'post',
          title: '发布了新文章',
          description: '关于现代Web开发趋势的思考',
          timestamp: '2024-01-15T10:30:00Z',
          postId: 'post-1'
        },
        {
          id: '2',
          type: 'like',
          title: '点赞了文章',
          description: '如何设计优雅的API接口',
          timestamp: '2024-01-14T15:45:00Z',
          postId: 'post-2'
        },
        {
          id: '3',
          type: 'comment',
          title: '评论了文章',
          description: '在《前端性能优化实践》中发表了评论',
          timestamp: '2024-01-13T09:20:00Z',
          postId: 'post-3'
        },
        {
          id: '4',
          type: 'follow',
          title: '关注了用户',
          description: '开始关注 Jane Doe',
          timestamp: '2024-01-12T16:10:00Z'
        },
        {
          id: '5',
          type: 'post',
          title: '发布了新文章',
          description: '深入理解TypeScript泛型',
          timestamp: '2024-01-10T11:00:00Z',
          postId: 'post-4'
        }
      ]);
      hideLoading();
      setIsLoading(false);
    }, 800);
  }, [showLoading, hideLoading]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post': return <ExternalLink className="w-4 h-4 text-tech-cyan" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-tech-lightcyan" />;
      case 'like': return <Heart className="w-4 h-4 text-tech-sky" />;
      case 'follow': return <Eye className="w-4 h-4 text-tech-deepblue" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <GlassCard className="overflow-hidden border-border shadow-lg transition-all duration-300">
      <div className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-tech-cyan" />
          活动历史
        </h2>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map(activity => (
                <div 
                  key={activity.id} 
                  className="flex items-start gap-4 p-4 rounded-lg bg-glass/30 backdrop-blur-sm border border-glass-border transition-colors duration-200 hover:bg-glass/50"
                >
                  <div className="mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground">{activity.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(activity.timestamp)}</span>
                    </div>
                  </div>
                  {activity.postId && (
                    <Button variant="ghost" size="sm">
                      查看
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <EmptyState
                size="sm"
                compact
                title="暂无活动记录"
                description="互动与动态会显示在这里"
              />
            )}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-glass-border flex justify-center">
          <Button variant="outline">
            加载更多
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}