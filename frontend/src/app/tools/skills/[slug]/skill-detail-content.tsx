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
import SkillDetailSidebar from '@/components/skills/SkillDetailSidebar';
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
 * 全屏沉浸 Hero + 加宽容器（max-w-7xl）；
 * lg 起左右分栏——左侧 sticky 侧栏（速览/本页目录/快速上手），右侧主内容；
 * 移动端隐藏目录卡，速览/快速上手插在简介之后。
 * 主内容各区块带 id 锚点（与侧栏目录对应）+ scroll-mt-24 避开固定导航。
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

      {/* ===== 内容区：加宽容器，lg 起侧栏 + 主栏分栏 ===== */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 pb-24">
        <div className="lg:flex lg:gap-10 xl:gap-12">
          {/* 左侧 sticky 侧栏（lg 起展示，含本页目录） */}
          <aside className="hidden lg:block lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-24 self-start">
            <SkillDetailSidebar skill={skill} />
          </aside>

          {/* 右侧主内容 */}
          <div className="flex-1 min-w-0">
            {/* 简介 */}
            <FadeIn>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {skill.description}
              </p>
            </FadeIn>

            {/* 移动端速览/快速上手（lg 以下展示在内容流顶部，不含目录卡） */}
            <FadeIn className="mt-10 lg:hidden">
              <SkillDetailSidebar skill={skill} showToc={false} />
            </FadeIn>

            {/* 能力亮点 */}
            <section id="highlights" className="mt-12 scroll-mt-24">
              <FadeIn delay={0.1}>
                <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">
                  能力亮点
                </h2>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {skill.highlights.map((highlight) => (
                    <li key={highlight}>
                      <GlassCard padding="sm" className="flex h-full items-start gap-3">
                        <span className="mt-0.5 p-1 rounded-md bg-primary/15 text-primary shrink-0">
                          <Sparkles className="w-4 h-4" aria-hidden />
                        </span>
                        <span className="text-sm text-foreground/90 leading-relaxed">
                          {highlight}
                        </span>
                      </GlassCard>
                    </li>
                  ))}
                </ul>
              </FadeIn>
            </section>

            {/* 工作原理 + 最佳实践：双栏并排（体量对等，要点列表） */}
            {((skill.howItWorks && skill.howItWorks.length > 0) ||
              (skill.bestPractices && skill.bestPractices.length > 0)) ? (
              <section id="how-it-works" className="mt-12 scroll-mt-24">
                <div className="grid gap-8 md:grid-cols-2 md:gap-12">
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
              </section>
            ) : null}

            {/* 适合 / 不适合（可选） */}
            {skill.fitMatrix ? (
              <section id="fit-matrix" className="mt-12 scroll-mt-24">
                <FadeIn delay={0.1}>
                  <h2 className="font-display text-2xl font-bold text-foreground tracking-tight mb-6">
                    适合 / 不适合
                  </h2>
                  <SkillFitMatrix fit={skill.fitMatrix.fit} notFit={skill.fitMatrix.notFit} />
                </FadeIn>
              </section>
            ) : null}

            {/* 适用场景（可选） */}
            {skill.scenes && skill.scenes.length > 0 ? (
              <section id="scenes" className="mt-12 scroll-mt-24">
                <FadeIn delay={0.1}>
                  <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">
                    适用场景
                  </h2>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {skill.scenes.map((scene) => (
                      <li
                        key={scene}
                        className="flex items-start gap-3 rounded-lg border border-glass-border bg-glass/50 p-4"
                      >
                        <span
                          className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0"
                          aria-hidden
                        />
                        <span className="text-sm text-foreground/90 leading-relaxed">
                          {scene}
                        </span>
                      </li>
                    ))}
                  </ul>
                </FadeIn>
              </section>
            ) : null}

            {/* 示例提示词 */}
            <section id="prompts" className="mt-12 scroll-mt-24">
              <FadeIn delay={0.1}>
                <SkillPromptCard prompts={skill.examplePrompts} />
              </FadeIn>
            </section>

            {/* 站内托管 SKILL.md：预览 + 下载 */}
            {skill.contentPath ? (
              <section id="content" className="mt-12 scroll-mt-24">
                <FadeIn delay={0.1}>
                  <SkillContentPanel
                    slug={skill.slug}
                    contentPath={skill.contentPath}
                    contentMarkdown={contentMarkdown}
                  />
                </FadeIn>
              </section>
            ) : null}

            {/* 关联 skill + 来源外链：双栏并排（都有/任一有时渲染） */}
            {related.length > 0 || skill.sourceUrl ? (
              <section id="related" className="mt-12 scroll-mt-24">
                <div className="grid gap-8 md:grid-cols-2 md:gap-12">
                  {related.length > 0 ? (
                    <FadeIn delay={0.1}>
                      <h2 className="font-display text-2xl font-bold text-foreground tracking-tight mb-6">
                        相关推荐
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
              </section>
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
                        上一个
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
                        下一个
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
        </div>
      </div>
    </>
  );
}
