'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from '@/lib/framer-motion';
import { EASE, TRANSITION } from '@/lib/animation-utils';
import { cn } from '@/lib/utils';

interface TarotFlipCardProps {
  /** true = 展示牌面；false = 展示牌背 */
  flipped: boolean;
  back: ReactNode;
  face: ReactNode;
  /** 未翻开时点击触发（父组件负责置 flipped） */
  onFlip?: () => void;
  /** 逆位：翻开后面内容额外 rotate-180，与翻转动画一次性叠加（消除翻完才转的断层） */
  reversed?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * 双面 3D 翻牌容器（项目首个 preserve-3d 实现）。
 * 仅 transform/opacity，时长走 TRANSITION.DEFAULT（0.62s）；
 * 翻开瞬间叠加一次性辉光层（radial-gradient 淡入淡出，非循环）；
 * 逆位牌面在翻转的同时 rotate-180，避免「先翻再转」的视觉断层；
 * reduced-motion 时退化为直接切换，无旋转与辉光。
 */
export default function TarotFlipCard({
  flipped,
  back,
  face,
  onFlip,
  reversed = false,
  className,
  ariaLabel,
}: TarotFlipCardProps) {
  const reducedMotion = useReducedMotion();
  const flippable = !flipped && !!onFlip;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('relative', className)}
      style={{ perspective: 1000 }}
    >
      {reducedMotion ? (
        <div className="relative h-full w-full">
          {flipped ? <div className={cn('h-full w-full', reversed && 'rotate-180')}>{face}</div> : back}
        </div>
      ) : (
        <motion.div
          className="relative h-full w-full"
          style={{ transformStyle: 'preserve-3d' }}
          initial={false}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={TRANSITION.DEFAULT}
        >
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            {back}
          </div>
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            aria-hidden={!flipped}
          >
            {/* 逆位旋转放在 backface 容器内部，与翻转动画同步叠加，避免断层 */}
            <motion.div
              className="h-full w-full"
              initial={false}
              animate={{ rotate: reversed ? 180 : 0 }}
              transition={TRANSITION.DEFAULT}
            >
              {/* 未翻开时不渲染牌面（容器 absolute inset-0，布局不受影响），
                  避免屏幕阅读器提前读到牌名；aria-hidden 双保险 */}
              {flipped ? face : null}
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* 翻开瞬间的一次性辉光（仅 opacity，非循环） */}
      {!reducedMotion ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--tech-purple) 50%, transparent) 0%, transparent 72%)',
          }}
          initial={false}
          animate={flipped ? { opacity: [0, 0.9, 0] } : { opacity: 0 }}
          transition={{ duration: 0.75, ease: EASE.SMOOTH }}
        />
      ) : null}

      {/* 未翻开时的透明点击层（键盘可达） */}
      {flippable ? (
        <button
          type="button"
          onClick={onFlip}
          aria-label={ariaLabel ?? '翻开这张牌'}
          className="absolute inset-0 cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      ) : null}
    </div>
  );
}
