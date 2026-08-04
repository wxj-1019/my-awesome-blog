'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { showcaseSkills } from '@/mock/skills';
import PageShell from '@/components/layout/PageShell';
import PageHeader from '@/components/layout/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import { Stagger, StaggerItem } from '@/components/motion';
import SkillCard from '@/components/skills/SkillCard';
import { cn } from '@/lib/utils';

/** 类型筛选项：『全部』+ 数据模型中的两种收藏类型 */
type KindFilter = 'all' | 'skill' | 'mcp';

/** 筛选项 value → 展示文案 */
const KIND_FILTERS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'skill', label: 'Skill' },
  { value: 'mcp', label: 'MCP' },
];

/**
 * AI 工具收藏索引页：类型筛选按钮组 + 卡片网格。
 * 卡片点击进入 /tools/skills/[slug] 沉浸详情页；数据来自 @/mock/skills。
 */
export default function SkillsContent() {
  const [filter, setFilter] = useState<KindFilter>('all');

  const filteredSkills =
    filter === 'all'
      ? showcaseSkills
      : showcaseSkills.filter((skill) => skill.kind === filter);

  return (
    <PageShell density="narrow">
      <PageHeader
        title="AI 工具收藏"
        description="收藏优秀的 Skill 与 MCP，让 AI 助手更好用"
        icon={Sparkles}
        align="center"
      />

      {/* 类型筛选按钮组 */}
      <GlassCard padding="sm" className="max-w-md mx-auto flex items-center justify-center gap-2">
        {KIND_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              filter === value
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
            )}
          >
            {label}
          </button>
        ))}
      </GlassCard>

      {/* 卡片网格：filter 变化时整组 remount，避免 Stagger 已 visible 时新卡片卡在 opacity:0 */}
      {filteredSkills.length === 0 ? (
        <div
          role="status"
          className="mt-12 text-center text-sm text-muted-foreground"
        >
          当前类型暂无收录，换个筛选看看。
        </div>
      ) : (
        <Stagger
          key={filter}
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          itemCount={filteredSkills.length}
        >
          {filteredSkills.map((skill) => (
            <StaggerItem key={skill.slug} className="h-full">
              <SkillCard skill={skill} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </PageShell>
  );
}
