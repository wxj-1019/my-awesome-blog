'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLeft, ArrowRight, ExternalLink, Sparkles, Workflow, CheckCircle } from 'lucide-react';
import { FadeIn } from '@/components/motion';
import GlassCard from '@/components/ui/GlassCard';
import SkillDetailHero from '@/components/skills/SkillDetailHero';
import SkillPromptCard from '@/components/skills/SkillPromptCard';
import SkillContentPanel from '@/components/skills/SkillContentPanel';
import SkillFitMatrix from '@/components/skills/SkillFitMatrix';
import SkillRelated, { type RelatedSkillRef } from '@/components/skills/SkillRelated';
import type { ShowcaseSkill } from '@/types/skill';

/** 相邻 skill 的极简导航信息 */
interface SkillNeighbor {
  /** 目标 skill 的 slug */
  slug: string;
  /** 目标 skill 的显示名称 */
  name: string;
}

export interface SkillDetailContentProps {
  /** 当前展示的 skill 数据 */
  skill: ShowcaseSkill;
  /** 上一个 skill（按 showcaseSkills 顺序循环） */
  prev: SkillNeighbor;
  /** 下一个 skill（按 showcaseSkills 顺序循环） */
  next: SkillNeighbor;
  /** Server 注入的 SKILL.md 正文；null 表示缺失 */
  contentMarkdown?: string | null;
  /** 关联 skill（Server 解析后），用于互链 */
  related?: RelatedSkillRef[];
}

/**
 * Skill 详情页编排（Client）：
 * 全屏沉浸 Hero + 窄列内容区（简介 → 能力亮点 → 适用场景 → 示例提示词 → 来源外链）
 * + 底部上一个/下一个/返回全览导航。
 */
export default function SkillDetailContent({
  skill,
  prev,
  next,
  contentMarkdown = null,
  related = [],
}: SkillDetailContentProps) {
  return (
    <>
      <SkillDetailHero skill={skill} />

      {/* ===== 内容区：加宽容器，部分区块双栏 ===== */}
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 pb-24">
        {/* 简介 */}
        <FadeIn>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {skill.description}
          </p>
        </FadeIn>

        {/* 能力亮点 */}
        <FadeIn delay={0.1} className="mt-12">
          <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">
            能力亮点
          </h2>
          <ul className="mt-6 space-y-3">
            {skill.highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-3">
                <span className="mt-0.5 p-1 rounded-md bg-primary/15 text-primary shrink-0">
                  <Sparkles className="w-4 h-4" aria-hidden />
                </span>
                <span className="text-foreground/90 leading-relaxed">
                  {highlight}
                </span>
              </li>
            ))}
          </ul>
        </FadeIn>

        {/* 工作原理 + 最佳实践：双栏并排（体量对等，要点列表） */}
        {((skill.howItWorks && skill.howItWorks.length > 0) ||
          (skill.bestPractices && skill.bestPractices.length > 0)) ? (
          <div className="mt-12 grid gap-8 md:grid-cols-2 md:gap-12">
            {skill.howItWorks && skill.howItWorks.length > 0 ? (
              <FadeIn delay={0.1}>
                <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">
                  工作原理
                </h2>
                <ul className="mt-6 space-y-3">
                  {skill.howItWorks.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span className="mt-0.5 p-1 rounded-md bg-primary/15 text-primary shrink-0">
                        <Workflow className="w-4 h-4" aria-hidden />
                      </span>
                      <span className="text-foreground/90 leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>
            ) : null}
            {skill.bestPractices && skill.bestPractices.length > 0 ? (
              <FadeIn delay={0.1}>
                <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">
                  最佳实践
                </h2>
                <ul className="mt-6 space-y-3">
                  {skill.bestPractices.map((tip) => (
                    <li key={tip} className="flex items-start gap-3">
                      <span className="mt-0.5 p-1 rounded-md bg-emerald-500/15 text-emerald-500 shrink-0">
                        <CheckCircle className="w-4 h-4" aria-hidden />
                      </span>
                      <span className="text-foreground/90 leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>
            ) : null}
          </div>
        ) : null}

        {/* 适合 / 不适合（可选） */}
        {skill.fitMatrix ? (
          <FadeIn delay={0.1} className="mt-12">
            <h2 className="font-display text-2xl font-bold text-foreground tracking-tight mb-6">
              适合 / 不适合
            </h2>
            <SkillFitMatrix fit={skill.fitMatrix.fit} notFit={skill.fitMatrix.notFit} />
          </FadeIn>
        ) : null}

        {/* 适用场景（可选） */}
        {skill.scenes && skill.scenes.length > 0 ? (
          <FadeIn delay={0.1} className="mt-12">
            <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">
              适用场景
            </h2>
            <ul className="mt-6 space-y-3">
              {skill.scenes.map((scene) => (
                <li key={scene} className="flex items-start gap-3">
                  <span
                    className="mt-2.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0"
                    aria-hidden
                  />
                  <span className="text-foreground/90 leading-relaxed">
                    {scene}
                  </span>
                </li>
              ))}
            </ul>
          </FadeIn>
        ) : null}

        {/* 示例提示词 */}
        <FadeIn delay={0.1} className="mt-12">
          <SkillPromptCard prompts={skill.examplePrompts} />
        </FadeIn>

        {/* 站内托管 SKILL.md：预览 + 下载 */}
        {skill.contentPath ? (
          <FadeIn delay={0.1} className="mt-12">
            <SkillContentPanel
              slug={skill.slug}
              contentPath={skill.contentPath}
              contentMarkdown={contentMarkdown}
            />
          </FadeIn>
        ) : null}

        {/* 关联 skill + 来源外链：双栏并排（都有/任一有时渲染） */}
        {related.length > 0 || skill.sourceUrl ? (
          <div className="mt-12 grid gap-8 md:grid-cols-2 md:gap-12">
            {related.length > 0 ? (
              <FadeIn delay={0.1}>
                <h2 className="font-display text-2xl font-bold text-foreground tracking-tight mb-6">
                  关联 skill
                </h2>
                <SkillRelated related={related} />
              </FadeIn>
            ) : null}
            {skill.sourceUrl ? (
              <FadeIn delay={0.1}>
                <h2 className="font-display text-2xl font-bold text-foreground tracking-tight mb-6">
                  来源
                </h2>
                <a
                  href={skill.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-glass-border bg-glass text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  查看来源
                  <ExternalLink className="w-4 h-4" aria-hidden />
                </a>
              </FadeIn>
            ) : null}
          </div>
        ) : null}

        {/* ===== 底部导航：上一个 / 返回全览 / 下一个 ===== */}
        <FadeIn delay={0.1} className="mt-16">
          <nav
            aria-label="Skill 导航"
            className="border-t border-glass-border pt-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href={`/tools/skills/${prev.slug}` as Route}
                className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
              >
                <GlassCard
                  padding="sm"
                  hoverEffect
                  className="h-full group-hover:border-primary/40"
                >
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
                    上一个 skill
                  </span>
                  <span className="mt-1 block font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                    {prev.name}
                  </span>
                </GlassCard>
              </Link>
              <Link
                href={`/tools/skills/${next.slug}` as Route}
                className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
              >
                <GlassCard
                  padding="sm"
                  hoverEffect
                  className="h-full text-right group-hover:border-primary/40"
                >
                  <span className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                    下一个 skill
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                  </span>
                  <span className="mt-1 block font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                    {next.name}
                  </span>
                </GlassCard>
              </Link>
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/tools/skills"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden />
                返回全览
              </Link>
            </div>
          </nav>
        </FadeIn>
      </div>
    </>
  );
}
