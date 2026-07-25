'use client';

import { Compass, ExternalLink, FileText, ListTree, Rocket } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import type { ShowcaseSkill } from '@/types/skill';

export interface SkillDetailSidebarProps {
  /** 当前展示的 skill 数据 */
  skill: ShowcaseSkill;
  /** 是否渲染「本页目录」卡（宽屏 sticky 栏展示，移动端传 false 隐藏） */
  showToc?: boolean;
}

/** 领域标签 → Badge 变体映射（与 SkillDetailHero 保持一致） */
const DOMAIN_BADGE_VARIANT: Record<
  ShowcaseSkill['domain'],
  'default' | 'secondary' | 'outline'
> = {
  前端: 'default',
  后端: 'secondary',
  通用: 'outline',
};

/** 目录条目：页内锚点 id + 展示文案 */
interface TocItem {
  /** 目标区块的锚点 id（与 skill-detail-content 中 section id 对应） */
  id: string;
  /** 目录中展示的中文文案 */
  label: string;
}

/** 按该 skill 实际存在的区块组装目录（与详情页条件渲染保持一致） */
function buildTocItems(skill: ShowcaseSkill): TocItem[] {
  const items: TocItem[] = [{ id: 'highlights', label: '能力亮点' }];
  if (
    (skill.howItWorks && skill.howItWorks.length > 0) ||
    (skill.bestPractices && skill.bestPractices.length > 0)
  ) {
    items.push({ id: 'how-it-works', label: '工作原理与最佳实践' });
  }
  if (skill.fitMatrix) {
    items.push({ id: 'fit-matrix', label: '适合 / 不适合' });
  }
  if (skill.scenes && skill.scenes.length > 0) {
    items.push({ id: 'scenes', label: '适用场景' });
  }
  items.push({ id: 'prompts', label: '示例提示词' });
  if (skill.contentPath) {
    items.push({ id: 'content', label: '托管正文' });
  }
  if ((skill.relatedSlugs && skill.relatedSlugs.length > 0) || skill.sourceUrl) {
    items.push({ id: 'related', label: '相关推荐' });
  }
  return items;
}

/**
 * Skill 详情页侧栏：速览（领域/来源/SKILL.md 入口）+ 本页目录 + 快速上手。
 * 宽屏下作为左侧 sticky 栏；移动端隐藏目录卡，速览/快速上手插在内容流中。
 * 锚点链接依赖全局 html { scroll-behavior: smooth }（reduced-motion 时自动退化为 auto）。
 */
export default function SkillDetailSidebar({
  skill,
  showToc = true,
}: SkillDetailSidebarProps) {
  const tocItems = buildTocItems(skill);

  return (
    <div className="space-y-4">
      {/* ===== 速览卡 ===== */}
      <GlassCard padding="sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Compass className="w-4 h-4 text-primary" aria-hidden />
          <span className="text-xs font-semibold tracking-[0.2em] uppercase">
            速览
          </span>
        </div>
        <div className="mt-3">
          <Badge variant={DOMAIN_BADGE_VARIANT[skill.domain]}>
            {skill.domain}
          </Badge>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {skill.sourceUrl ? (
            <li>
              <a
                href={skill.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                查看来源仓库
              </a>
            </li>
          ) : null}
          {skill.contentPath ? (
            <li>
              <a
                href="#content"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              >
                <FileText className="w-3.5 h-3.5" aria-hidden />
                阅读 SKILL.md
              </a>
            </li>
          ) : null}
        </ul>
      </GlassCard>

      {/* ===== 本页目录（仅宽屏 sticky 栏渲染） ===== */}
      {showToc ? (
        <GlassCard padding="sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ListTree className="w-4 h-4 text-primary" aria-hidden />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase">
              本页目录
            </span>
          </div>
          <nav aria-label="本页目录">
            <ul className="mt-3 space-y-1.5 text-sm">
              {tocItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="block rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </GlassCard>
      ) : null}

      {/* ===== 快速上手（有 installSteps 时渲染） ===== */}
      {skill.installSteps && skill.installSteps.length > 0 ? (
        <GlassCard padding="sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Rocket className="w-4 h-4 text-primary" aria-hidden />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase">
              快速上手
            </span>
          </div>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-foreground/85 marker:text-primary">
            {skill.installSteps.map((step) => (
              <li key={step} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </GlassCard>
      ) : null}
    </div>
  );
}
