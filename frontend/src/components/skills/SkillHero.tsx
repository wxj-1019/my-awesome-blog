'use client';

import { motion } from '@/lib/framer-motion';
import { ChevronDown } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE, TRANSITION, STAGGER } from '@/lib/animation-utils';
import { cn } from '@/lib/utils';

/** 标题文本：逐字错落入场，「Skill」与「收藏馆」分两组节奏 */
const TITLE_GROUPS: { text: string; chars: string[] }[] = [
  { text: 'Skill', chars: ['S', 'k', 'i', 'l', 'l'] },
  { text: '收藏馆', chars: ['收', '藏', '馆'] },
];

/**
 * Skill 收藏馆 · 电影式开场（全屏 Hero）
 * - 背景：token 渐变的胶片光束 + 聚光，一次性极慢入场，只动 transform/opacity
 * - 标题：逐字错落升起，整页唯一「哇点」
 * - reduced-motion：所有动画退化为直接呈现
 */
export default function SkillHero() {
  const reduced = useReducedMotion();

  return (
    <section
      aria-label="Skill 收藏馆开场"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
    >
      {/* ===== 背景氛围层：胶片光束 + 聚光（装饰，只动 transform/opacity） ===== */}
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
        {/* 胶片光束 · 左：斜切光束缓慢亮起 */}
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
        {/* 胶片光束 · 右：与左束错拍 */}
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

      {/* ===== 文案层 ===== */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* 幕标：电影字幕式小标题 */}
        <motion.p
          className="mb-6 text-[11px] sm:text-xs font-medium tracking-[0.4em] text-primary/90"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...TRANSITION.DEFAULT, delay: 0.2 }}
        >
          THE SKILL COLLECTION
        </motion.p>

        {/* 超大标题：逐字错落入场（本页唯一哇点） */}
        <h1
          className={cn(
            'font-display font-bold leading-none tracking-tight text-foreground',
            'text-[clamp(3.5rem,12vw,8.5rem)]'
          )}
        >
          {TITLE_GROUPS.map((group, gi) => (
            <span
              key={group.text}
              className={cn('inline-block whitespace-nowrap', gi > 0 && 'ml-[0.18em]')}
            >
              {group.chars.map((char, ci) => {
                // 全局字序：跨组连续错拍
                const order =
                  TITLE_GROUPS.slice(0, gi).reduce((n, g) => n + g.chars.length, 0) + ci;
                return (
                  <motion.span
                    key={`${group.text}-${ci}`}
                    className="inline-block will-change-transform"
                    initial={reduced ? false : { opacity: 0, y: '0.55em', rotate: 4 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{
                      ...TRANSITION.SLOW,
                      delay: 0.35 + order * STAGGER.TIGHT * 2,
                    }}
                  >
                    {char}
                  </motion.span>
                );
              })}
            </span>
          ))}
        </h1>

        {/* 副标题 */}
        <motion.p
          className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-muted-foreground"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...TRANSITION.DEFAULT, delay: 1.1 }}
        >
          收录让我在写代码时如虎添翼的 AI Agent Skills
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

      {/* ===== 向下滚动提示：静态 + 透明度脉冲 ===== */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...TRANSITION.DEFAULT, delay: 1.6 }}
      >
        <span className="text-xs font-medium tracking-[0.3em] text-muted-foreground">
          向下滚动
        </span>
        <motion.div
          animate={reduced ? {} : { opacity: [1, 0.35, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="h-5 w-5 text-primary" aria-hidden />
        </motion.div>
      </motion.div>
    </section>
  );
}
