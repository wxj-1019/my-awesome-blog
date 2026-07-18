'use client';
import Link from 'next/link';
import { TrendingUp, Eye, ThumbsUp, MessageCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import { memo } from 'react';
interface Article {
  id: string;
  title: string;
  view_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
}
interface HotArticlesProps {
  articles: Article[];
}
function HotArticles({ articles }: HotArticlesProps) {
  const { themedClasses, getThemeClass } = useThemedClasses();
  const textClass = themedClasses.textClass;
  const mutedTextClass = themedClasses.mutedTextClass;
  // 取前6篇热门文章（按浏览量排序）
  const hotArticles = articles
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 6);
  if (!hotArticles || hotArticles.length === 0) {
    return null;
  }
  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-tech-cyan" />
        <h3 className="text-lg font-bold">热门文章</h3>
      </div>
      <div className="space-y-3">
        {hotArticles.map((article, index) => (
          <Link
            key={article.id}
            href={`/articles/${article.id}`}
            className="group block p-3 rounded-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-start gap-3">
              {/* 排名徽章 */}
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index < 3
                    ? 'bg-tech-cyan text-white'
                    : getThemeClass(
                        'bg-glass/20 text-foreground/70',
                        'bg-gray-200 text-gray-600'
                      )
                }`}
              >
                {index + 1}
              </div>
              {/* 文章内容 */}
              <div className="flex-1 min-w-0">
                <h4
                  className={`text-sm font-medium line-clamp-2 mb-1.5 ${textClass} group-hover:text-tech-cyan transition-colors`}
                >
                  {article.title}
                </h4>
                {/* 统计数据 */}
                <div className="flex items-center gap-3 text-xs">
                  <div className={`flex items-center gap-1 ${mutedTextClass}`}>
                    <Eye className="h-3 w-3" />
                    <span>{article.view_count}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${mutedTextClass}`}>
                    <ThumbsUp className="h-3 w-3" />
                    <span>{article.likes_count}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${mutedTextClass}`}>
                    <MessageCircle className="h-3 w-3" />
                    <span>{article.comments_count}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </GlassCard>
  );
}
export default memo(HotArticles);