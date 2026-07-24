'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from '@/lib/framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { TRANSITION, VIEWPORT } from '@/lib/animation-utils';
import { cn } from '@/lib/utils';
import GlassCard from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, Terminal, ExternalLink } from 'lucide-react';
import type { ShowcaseSkill } from '@/types/skill';

export interface SkillActProps {
  /** 当前展示的 skill 数据 */
  skill: ShowcaseSkill;
  /** 当前幕序号（从 0 开始） */
  index: number;
  /** 总幕数，用于「01 / 05」式序号 */
  total: number;
}

/** 领域标签 → Badge 变体映射（前端/后端/通用视觉区分） */
const DOMAIN_BADGE_VARIANT: Record<
  ShowcaseSkill['domain'],
  'default' | 'secondary' | 'outline'
> = {
  前端: 'default',
  后端: 'secondary',
  通用: 'outline',
};

/** 两位补零序号，如 1 → "01" */
function padOrder(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Skill 收藏馆·分幕组件：每个 skill 一幕，min-h-screen 全屏展示。
 * 奇偶幕左右交替布局（移动端单列）；滚动驱动视差 + 入场淡入；
 * prefers-reduced-motion 时整体回退为静态。
 */
export default function SkillAct({ skill, index, total }: SkillActProps) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);

  // 滚动叙事：序号大字缓慢视差上浮，字幕卡片轻微滞后跟入
  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ['start end', 'end start'],
  });
  const orderY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const cardY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  // 偶数幕文字在左、奇数幕文字在右（移动端统一单列）
  const reversed = index % 2 === 1;

  /** 超大半透明幕序号（如 01 / 05），装饰性，屏读器忽略 */
  const orderNumber = (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none select-none font-display font-bold leading-none',
        'text-[7rem] sm:text-[10rem] lg:text-[14rem]',
        'text-foreground/5',
        'absolute -top-6 sm:-top-10 z-0',
        reversed ? 'right-0 lg:right-auto lg:-left-4' : 'left-0 lg:-left-4'
      )}
    >
      {padOrder(index + 1)}
      <span className="text-[0.4em] text-foreground/20"> / {padOrder(total)}</span>
    </div>
  );

  /** 文字侧：名称 + 领域徽章 + 台词 + 正文 + 亮点 + 外链 */
  const textColumn = (
    <div className="relative z-10">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
          {skill.name}
        </h2>
        <Badge
          variant={DOMAIN_BADGE_VARIANT[skill.domain]}
          className="text-sm px-3 py-1"
        >
          {skill.domain}
        </Badge>
      </div>

      {/* 台词：一句话标语，如电影字幕般突出 */}
      <p className="mt-4 text-xl sm:text-2xl text-primary font-medium tracking-wide">
        「{skill.tagline}」
      </p>

      <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
        {skill.description}
      </p>

      {/* 能力亮点 */}
      <ul className="mt-7 space-y-3">
        {skill.highlights.map((highlight) => (
          <li key={highlight} className="flex items-start gap-3">
            <span className="mt-0.5 p-1 rounded-md bg-primary/15 text-primary shrink-0">
              <Sparkles className="w-4 h-4" aria-hidden />
            </span>
            <span className="text-foreground/90 leading-relaxed">{highlight}</span>
          </li>
        ))}
      </ul>

      {/* 来源外链（可选） */}
      {skill.sourceUrl ? (
        <a
          href={skill.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'mt-8 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
            'border border-glass-border bg-glass text-foreground',
            'hover:border-primary/40 hover:text-primary transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          查看来源
          <ExternalLink className="w-4 h-4" aria-hidden />
        </a>
      ) : null}
    </div>
  );

  /** 字幕卡片：示例提示词，终端/电影字幕风格 */
  const promptCard = (
    <GlassCard padding="md" className="relative z-10 font-mono text-sm">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-glass-border text-muted-foreground">
        <Terminal className="w-4 h-4 text-primary" aria-hidden />
        <span className="text-xs tracking-[0.2em] uppercase">示例提示词</span>
      </div>
      <div className="space-y-3">
        {skill.examplePrompts.map((prompt) => (
          <p key={prompt} className="flex gap-2 leading-relaxed">
            <span className="text-primary shrink-0" aria-hidden>
              &gt;
            </span>
            <span className="text-foreground/85">{prompt}</span>
          </p>
        ))}
      </div>
    </GlassCard>
  );

  /** 双栏内容：按奇偶幕交替左右顺序 */
  const contentGrid = (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
      <div className={cn(reversed && 'lg:order-2')}>{textColumn}</div>
      <div className={cn(reversed && 'lg:order-1')}>
        {reduced ? (
          promptCard
        ) : (
          <motion.div style={{ y: cardY }} className="will-change-transform">
            {promptCard}
          </motion.div>
        )}
      </div>
    </div>
  );

  return (
    <section
      ref={rootRef}
      id={skill.slug}
      data-act={skill.name}
      aria-label={`第 ${index + 1} 幕：${skill.name}`}
      className="relative min-h-screen flex items-center scroll-mt-20 py-20 sm:py-24 overflow-hidden"
    >
      {/* 背景序号（reduced-motion 时静态渲染） */}
      {reduced ? (
        orderNumber
      ) : (
        <motion.div
          style={{ y: orderY }}
          className="will-change-transform absolute inset-0"
        >
          {orderNumber}
        </motion.div>
      )}

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {reduced ? (
          contentGrid
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT.ONCE}
            transition={TRANSITION.SLOW}
          >
            {contentGrid}
          </motion.div>
        )}
      </div>
    </section>
  );
}
