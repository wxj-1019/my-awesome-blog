import { ExternalLink, Github, FolderGit2, Star } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import type { PortfolioItem } from '@/lib/api/portfolio';
import { cn } from '@/lib/utils';

/** 技术栈标签最多展示数量，超出折叠为 +N */
const MAX_TECH_BADGES = 5;

const STATUS_META: Record<string, { label: string; className: string }> = {
  completed: { label: '已完成', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  in_progress: { label: '进行中', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  planned: { label: '规划中', className: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30' },
};

/**
 * 作品卡片（Server Component）：封面 + 标题 + 描述 + 技术栈 + 状态/精选徽章 + 外链。
 * hover 微交互纯 CSS（group-hover），无客户端 JS。
 */
export default function PortfolioCard({ item }: { item: PortfolioItem }) {
  const techs = item.technologies ?? [];
  const visibleTechs = techs.slice(0, MAX_TECH_BADGES);
  const hiddenCount = techs.length - visibleTechs.length;
  const statusMeta = (item.status && STATUS_META[item.status]) || null;

  return (
    <GlassCard padding="none" className="group flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1">
      {/* 封面 16:9 */}
      <div className="relative aspect-video overflow-hidden bg-muted/40">
        {item.cover_image ? (
          // 封面来自 MinIO/外部 URL，缩略场景用裸 img（项目惯例，见 CoverPicker）
          <img
            src={item.cover_image}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-transparent">
            <FolderGit2 className="h-10 w-10 text-muted-foreground/50" aria-hidden />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {item.is_featured ? (
            <Badge variant="default" className="gap-1">
              <Star className="h-3 w-3" aria-hidden />
              精选
            </Badge>
          ) : null}
          {statusMeta ? (
            <Badge variant="outline" className={cn('backdrop-blur-sm', statusMeta.className)}>
              {statusMeta.label}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-serif text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
          {item.title}
        </h3>
        {item.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
        ) : null}

        {visibleTechs.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {visibleTechs.map((tech) => (
              <Badge key={tech} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
            {hiddenCount > 0 ? (
              <Badge variant="outline" className="text-xs">
                +{hiddenCount}
              </Badge>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
          {item.start_date ? (
            <span>
              {item.start_date} – {item.end_date ?? '至今'}
            </span>
          ) : (
            <span />
          )}
          <span className="flex gap-3">
            {item.demo_url ? (
              <a
                href={item.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${item.title} 在线预览`}
                className="inline-flex items-center gap-1 transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                在线预览
              </a>
            ) : null}
            {item.github_url ? (
              <a
                href={item.github_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${item.title} 源码`}
                className="inline-flex items-center gap-1 transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <Github className="h-3.5 w-3.5" aria-hidden />
                源码
              </a>
            ) : null}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
