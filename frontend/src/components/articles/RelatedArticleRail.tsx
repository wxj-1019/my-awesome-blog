import Link from 'next/link';
import { ArrowRight, Eye } from 'lucide-react';

import GlassCard from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import type { RelatedArticle } from '@/types';

export interface RelatedArticleRailProps {
  /** 右轨展示的相关文章，最多渲染前五篇 */
  articles: RelatedArticle[];
  className?: string;
  /** 可覆盖的区块标题 */
  heading?: string;
}

export default function RelatedArticleRail({
  articles,
  className,
  heading = '相关文章',
}: RelatedArticleRailProps) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <GlassCard padding="none" className={cn('p-5', className)}>
      <h3 className="mb-4 text-lg font-semibold text-foreground">{heading}</h3>
      <div className="space-y-2">
        {articles.slice(0, 5).map(article => (
          <Link
            key={article.id}
            href={`/articles/${article.id}`}
            className="block rounded-lg px-3 py-2.5 text-foreground transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="line-clamp-2 font-medium">{article.title}</span>
            <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>{article.category.name}</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3" aria-hidden="true" />
                {article.view_count} 阅读
              </span>
            </span>
          </Link>
        ))}
      </div>
      <Link
        href="/articles"
        className="mt-4 flex min-h-11 items-center justify-between border-t border-dashed border-border px-3 pt-4 text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        查看全部文章
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </GlassCard>
  );
}
