'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLeft } from 'lucide-react';
import { showcaseSkills } from '@/mock/skills';
import SkillHero from '@/components/skills/SkillHero';
import SkillAct from '@/components/skills/SkillAct';
import { FadeIn } from '@/components/motion';

/**
 * Skill 收藏馆编排：全屏开场 Hero → 每个 skill 一幕（电影式分幕滚动）→ 收尾区。
 * 数据与分幕组件来自契约模块（@/mock/skills、@/components/skills/*）。
 */
export default function SkillsContent() {
  const total = showcaseSkills.length;

  return (
    <div className="text-foreground">
      {/* 全屏开场 */}
      <SkillHero />

      {/* 分幕：每个收藏的 skill 一幕，index 从 0 开始 */}
      {showcaseSkills.map((skill, index) => (
        <SkillAct key={skill.slug} skill={skill} index={index} total={total} />
      ))}

      {/* 收尾区：持续收录中 + 返回百宝箱 */}
      <FadeIn className="container mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
        <p className="text-[11px] sm:text-xs font-medium tracking-[0.28em] text-primary/90">
          未完待续
        </p>
        <h2 className="mt-3 text-2xl sm:text-3xl font-semibold text-foreground">
          持续收录中
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
          遇到好用的 AI Agent Skill 会陆续收入馆中，欢迎常回来看看。
        </p>
        <Link
          href={'/tools' as Route}
          className="mt-8 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          返回百宝箱
        </Link>
      </FadeIn>
    </div>
  );
}
