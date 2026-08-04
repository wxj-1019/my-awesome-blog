import Link from 'next/link';
import type { Route } from 'next';
import { ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { ShowcaseSkill } from '@/types/skill';
import { cn } from '@/lib/utils';

export interface RelatedSkillRef {
  slug: string;
  name: string;
  domain: ShowcaseSkill['domain'];
}

export interface SkillRelatedProps {
  related: RelatedSkillRef[];
}

const DOMAIN_VARIANT: Record<ShowcaseSkill['domain'], 'default' | 'secondary' | 'outline'> = {
  前端: 'default',
  后端: 'secondary',
  通用: 'outline',
};

/**
 * 关联 skill 卡片链：点击跳对应详情页，形成知识网。
 */
export default function SkillRelated({ related }: SkillRelatedProps) {
  if (related.length === 0) {return null;}

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {related.map((r) => (
        <Link
          key={r.slug}
          href={`/tools/skills/${r.slug}` as Route}
          className={cn(
            'group flex items-center justify-between gap-3 rounded-xl p-4',
            'border border-glass-border bg-glass transition-colors',
            'hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <div className="min-w-0">
            <span className="block font-display font-semibold text-foreground group-hover:text-primary transition-colors">
              {r.name}
            </span>
            <Badge variant={DOMAIN_VARIANT[r.domain]} className="mt-1.5">
              {r.domain}
            </Badge>
          </div>
          <ArrowUpRight
            className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
            aria-hidden
          />
        </Link>
      ))}
    </div>
  );
}
