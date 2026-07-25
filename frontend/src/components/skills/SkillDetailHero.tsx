'use client';

import Link from 'next/link';
import { motion } from '@/lib/framer-motion';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE, TRANSITION } from '@/lib/animation-utils';
import { Badge } from '@/components/ui/Badge';
import type { ShowcaseSkill } from '@/types/skill';

export interface SkillDetailHeroProps {
  /** 当前展示的 skill 数据 */
  skill: ShowcaseSkill;
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

/** 收藏类型 → Badge 变体映射：skill default / mcp secondary */
const KIND_BADGE_VARIANT: Record<ShowcaseSkill['kind'], 'default' | 'secondary'> = {
  skill: 'default',
  mcp: 'secondary',
};

/** 收藏类型 → 徽章文案 */
const KIND_BADGE_LABEL: Record<ShowcaseSkill['kind'], string> = {
  skill: 'Skill',
  mcp: 'MCP',
};

/**
 * Skill 详情页 · 轻量开场（减重版）
 * - 顶部「← 返回全览」返回索引页
 * - 标题整体淡入上浮（去逐字错落，避免拖沓）
 * - 背景仅留顶部聚光一层（去双光束/暗角，减少视觉嘈杂）
 * - 高度 min-h-[70vh]（不再压满整屏，把空间让给内容区）
 * - reduced-motion：所有动画退化为直接呈现
 */
export default function SkillDetailHero({ skill }: SkillDetailHeroProps) {
  const reduced = useReducedMotion();

  return (
    <section
      aria-label={`${skill.name} 详情开场`}
      className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden"
    >
      {/* ===== 背景氛围层：仅顶部聚光（装饰，只动 transform/opacity） ===== */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <motion.div
          className="absolute left-1/2 top-[-20%] h-[70vh] w-[90vw] max-w-5xl -translate-x-1/2 rounded-full will-change-transform"
          style={{
            background:
              'radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 22%, transparent) 0%, color-mix(in srgb, var(--accent) 10%, transparent) 45%, transparent 72%)',
          }}
          initial={reduced ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...TRANSITION.SLOW, duration: 1.0, ease: EASE.SMOOTH }}
        />
      </div>

      {/* ===== 返回全览 ===== */}
      <motion.div
        className="absolute left-4 top-20 z-20 sm:left-8 sm:top-24"
        initial={reduced ? false : { opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...TRANSITION.DEFAULT, delay: 0.2 }}
      >
        <Link
          href="/tools/skills"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          返回全览
        </Link>
      </motion.div>

      {/* ===== 文案层 ===== */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* 领域徽章 */}
        <motion.div
          className="mb-6 flex justify-center"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...TRANSITION.DEFAULT, delay: 0.15 }}
        >
          <Badge
            variant={DOMAIN_BADGE_VARIANT[skill.domain]}
            className="text-sm px-3 py-1"
          >
            {skill.domain}
          </Badge>
        </motion.div>

        {/* skill 名称 + 类型徽章：整体一次淡入上浮（减重，不再逐字错落） */}
        <div className="flex items-center justify-center gap-3">
          <motion.h1
            className="font-display font-bold leading-tight tracking-tight text-foreground text-[clamp(2.25rem,7vw,4.5rem)] break-words"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...TRANSITION.DEFAULT, delay: 0.2 }}
          >
            {skill.name}
          </motion.h1>
          <Badge
            variant={KIND_BADGE_VARIANT[skill.kind]}
            className="shrink-0 text-sm px-3 py-1"
          >
            {KIND_BADGE_LABEL[skill.kind]}
          </Badge>
        </div>

        {/* 台词：一句话标语，电影字幕感 */}
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl lg:text-2xl text-primary font-medium tracking-wide"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...TRANSITION.DEFAULT, delay: 0.3 }}
        >
          「{skill.tagline}」
        </motion.p>

        {/* 装饰细线：幕间分界 */}
        <motion.div
          className="mx-auto mt-8 h-px w-20 sm:w-28 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
          initial={reduced ? false : { opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ ...TRANSITION.SLOW, delay: 0.4 }}
          aria-hidden
        />
      </div>

      {/* ===== 向下滚动提示：静态呈现（更早出现） ===== */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...TRANSITION.DEFAULT, delay: 0.6 }}
      >
        <span className="text-xs font-medium tracking-[0.3em] text-muted-foreground">
          向下滚动
        </span>
        <ChevronDown className="h-5 w-5 text-primary" aria-hidden />
      </motion.div>
    </section>
  );
}
