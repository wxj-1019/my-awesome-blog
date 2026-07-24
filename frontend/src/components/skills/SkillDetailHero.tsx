'use client';

import Link from 'next/link';
import { motion } from '@/lib/framer-motion';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE, TRANSITION, STAGGER } from '@/lib/animation-utils';
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

/**
 * Skill 详情页 · 电影式沉浸开场（全屏 Hero）
 * - 顶部「← 返回全览」返回索引页
 * - 超大 skill 名称逐字错落入场（本页唯一哇点）
 * - 背景：token 渐变聚光 + 光束，一次性慢入场，只动 transform/opacity，无无限循环
 * - reduced-motion：所有动画退化为直接呈现
 */
export default function SkillDetailHero({ skill }: SkillDetailHeroProps) {
  const reduced = useReducedMotion();
  /** 名称逐字拆分，用于错落入场 */
  const nameChars = skill.name.split('');

  return (
    <section
      aria-label={`${skill.name} 详情开场`}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
    >
      {/* ===== 背景氛围层：聚光 + 光束（装饰，只动 transform/opacity，一次性入场） ===== */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {/* 顶部聚光：从幕顶打下的圆形光斑 */}
        <motion.div
          className="absolute left-1/2 top-[-20%] h-[70vh] w-[90vw] max-w-5xl -translate-x-1/2 rounded-full will-change-transform"
          style={{
            background:
              'radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 22%, transparent) 0%, color-mix(in srgb, var(--accent) 10%, transparent) 45%, transparent 72%)',
          }}
          initial={reduced ? false : { opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...TRANSITION.SLOW, duration: 1.6, ease: EASE.SMOOTH }}
        />
        {/* 光束 · 左：斜切光束缓慢亮起 */}
        <motion.div
          className="absolute left-[8%] top-[-10%] h-[130%] w-24 sm:w-36 rotate-[18deg] will-change-transform"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--primary) 16%, transparent), color-mix(in srgb, var(--primary) 4%, transparent) 60%, transparent)',
          }}
          initial={reduced ? false : { opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...TRANSITION.SLOW, duration: 1.4, delay: 0.4 }}
        />
        {/* 光束 · 右：与左束错拍 */}
        <motion.div
          className="absolute right-[10%] top-[-10%] h-[130%] w-20 sm:w-28 rotate-[-15deg] will-change-transform"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--accent) 14%, transparent), color-mix(in srgb, var(--accent) 4%, transparent) 60%, transparent)',
          }}
          initial={reduced ? false : { opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...TRANSITION.SLOW, duration: 1.4, delay: 0.7 }}
        />
        {/* 底部暗角：把视线压回标题 */}
        <div
          className="absolute inset-x-0 bottom-0 h-40"
          style={{
            background:
              'linear-gradient(to top, color-mix(in srgb, var(--background) 85%, transparent), transparent)',
          }}
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
          transition={{ ...TRANSITION.DEFAULT, delay: 0.25 }}
        >
          <Badge
            variant={DOMAIN_BADGE_VARIANT[skill.domain]}
            className="text-sm px-3 py-1"
          >
            {skill.domain}
          </Badge>
        </motion.div>

        {/* 超大名称：逐字错落入场（本页唯一哇点） */}
        <h1 className="font-display font-bold leading-none tracking-tight text-foreground text-[clamp(2.75rem,11vw,7.5rem)] break-all">
          {nameChars.map((char, ci) => (
            <motion.span
              key={`${skill.slug}-${ci}`}
              className="inline-block will-change-transform"
              initial={reduced ? false : { opacity: 0, y: '0.55em', rotate: 4 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{
                ...TRANSITION.SLOW,
                delay: 0.35 + ci * STAGGER.TIGHT * 2,
              }}
            >
              {char}
            </motion.span>
          ))}
        </h1>

        {/* 台词：一句话标语，如电影字幕般突出 */}
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-xl sm:text-2xl lg:text-3xl text-primary font-medium tracking-wide"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...TRANSITION.DEFAULT, delay: 1.1 }}
        >
          「{skill.tagline}」
        </motion.p>

        {/* 装饰细线：幕间分界 */}
        <motion.div
          className="mx-auto mt-8 h-px w-20 sm:w-28 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
          initial={reduced ? false : { opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ ...TRANSITION.SLOW, delay: 1.3 }}
          aria-hidden
        />
      </div>

      {/* ===== 向下滚动提示：静态呈现 ===== */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...TRANSITION.DEFAULT, delay: 1.6 }}
      >
        <span className="text-xs font-medium tracking-[0.3em] text-muted-foreground">
          向下滚动
        </span>
        <ChevronDown className="h-5 w-5 text-primary" aria-hidden />
      </motion.div>
    </section>
  );
}
