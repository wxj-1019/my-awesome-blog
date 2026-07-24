'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { showcaseSkills } from '@/mock/skills';
import type { ShowcaseSkill } from '@/types/skill';
import PageShell from '@/components/layout/PageShell';
import PageHeader from '@/components/layout/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import { Stagger, StaggerItem } from '@/components/motion';
import SkillCard from '@/components/skills/SkillCard';
import { cn } from '@/lib/utils';

/** 领域筛选项：『全部』+ 数据模型中的三种领域 */
type DomainFilter = '全部' | ShowcaseSkill['domain'];

const DOMAIN_FILTERS: DomainFilter[] = ['全部', '前端', '后端', '通用'];

/**
 * Skill 收藏馆索引页：领域筛选按钮组 + 卡片网格。
 * 卡片点击进入 /tools/skills/[slug] 沉浸详情页；数据来自 @/mock/skills。
 */
export default function SkillsContent() {
  const [filter, setFilter] = useState<DomainFilter>('全部');

  const filteredSkills =
    filter === '全部'
      ? showcaseSkills
      : showcaseSkills.filter((skill) => skill.domain === filter);

  return (
    <PageShell density="narrow">
      <PageHeader
        title="Skill 收藏馆"
        description="收录让我在写代码时如虎添翼的 AI Agent Skills"
        icon={Sparkles}
        align="center"
      />

      {/* 领域筛选按钮组 */}
      <GlassCard padding="sm" className="max-w-md mx-auto flex items-center justify-center gap-2">
        {DOMAIN_FILTERS.map((domain) => (
          <button
            key={domain}
            type="button"
            onClick={() => setFilter(domain)}
            aria-pressed={filter === domain}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              filter === domain
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
            )}
          >
            {domain}
          </button>
        ))}
      </GlassCard>

      {/* 卡片网格：key 用稳定的 slug */}
      <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSkills.map((skill) => (
          <StaggerItem key={skill.slug} className="h-full">
            <SkillCard skill={skill} />
          </StaggerItem>
        ))}
      </Stagger>
    </PageShell>
  );
}
