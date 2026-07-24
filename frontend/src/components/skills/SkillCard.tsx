'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import type { ShowcaseSkill } from '@/types/skill';
import GlassCard from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';

interface SkillCardProps {
  /** 索引页展示的单个 skill 数据 */
  skill: ShowcaseSkill;
}

/** 领域标签 → Badge 变体：前端 default / 后端 secondary / 通用 outline */
const domainVariant: Record<ShowcaseSkill['domain'], 'default' | 'secondary' | 'outline'> = {
  前端: 'default',
  后端: 'secondary',
  通用: 'outline',
};

/**
 * Skill 收藏馆索引卡片：整卡可点击，进入对应 skill 的沉浸详情页。
 * 动画仅依赖 GlassCard 的 hoverEffect（transform/shadow），无额外动效。
 */
export default function SkillCard({ skill }: SkillCardProps) {
  return (
    <Link
      href={`/tools/skills/${skill.slug}` as Route}
      className="block h-full group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
    >
      <GlassCard
        padding="md"
        hoverEffect
        className="h-full flex flex-col group-hover:border-primary/40"
      >
        {/* 名称 + 领域标签 */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {skill.name}
          </h3>
          <Badge variant={domainVariant[skill.domain]} className="shrink-0">
            {skill.domain}
          </Badge>
        </div>

        {/* 一句话标语 */}
        <p className="mt-2 text-sm font-medium text-primary/90">{skill.tagline}</p>

        {/* 详细介绍，两行截断 */}
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
          {skill.description}
        </p>

        {/* 行动入口 */}
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          进入体验
          <ArrowRight
            className="w-4 h-4 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </span>
      </GlassCard>
    </Link>
  );
}
