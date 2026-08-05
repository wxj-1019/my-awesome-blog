'use client';

import { memo } from 'react';
import { motion, useReducedMotion } from '@/lib/framer-motion';
import { EASE } from '@/lib/animation-utils';
import type { TarotCard } from '@/types/tarot';
import { cn } from '@/lib/utils';
import TarotCardBack from './TarotCardBack';

interface TarotDeckFanProps {
  /** 已洗好的牌序（显示为牌背，用户不知道每张是什么） */
  deck: TarotCard[];
  /** 已被选走的牌 id 集合 */
  pickedIds: ReadonlySet<string>;
  onPick: (card: TarotCard) => void;
  disabled?: boolean;
}

/** 扇形总弧度（度） */
const FAN_ARC_DEG = 76;

/**
 * 扇形牌阵：78 张牌背绕底部圆心弧形铺开。
 * 入场为一次性「发牌」动画（rotate 从 0 到目标角度， stagger ≤0.5s）；
 * 悬停浮起通过 framer 的 whileHover（y），避免与内联 transform 冲突。
 * 单张牌拆成 memo 化 FanCard：选牌时仅被选中的牌重渲染。
 */
export default function TarotDeckFan({ deck, pickedIds, onPick, disabled }: TarotDeckFanProps) {
  const reducedMotion = useReducedMotion();
  const n = deck.length;
  const step = FAN_ARC_DEG / n;

  return (
    <div
      className="relative mx-auto h-52 w-full max-w-3xl select-none sm:h-60"
      role="group"
      aria-label="牌堆：凭直觉点击抽牌；键盘用户可使用「代我抽牌」"
    >
      {deck.map((card, i) => (
        <FanCard
          key={card.id}
          card={card}
          angle={(i - (n - 1) / 2) * step}
          index={i}
          picked={pickedIds.has(card.id)}
          disabled={disabled ?? false}
          onPick={onPick}
          reducedMotion={reducedMotion ?? false}
        />
      ))}
    </div>
  );
}

interface FanCardProps {
  card: TarotCard;
  /** 扇形角度（度） */
  angle: number;
  /** 在牌堆中的位置（决定 zIndex 与入场延迟） */
  index: number;
  picked: boolean;
  disabled: boolean;
  onPick: (card: TarotCard) => void;
  reducedMotion: boolean;
}

const FanCard = memo(function FanCard({
  card,
  angle,
  index,
  picked,
  disabled,
  onPick,
  reducedMotion,
}: FanCardProps) {
  return (
    <motion.button
      type="button"
      // 78 张重叠卡片不适合键盘逐个 Tab 导航：移出 Tab 序（鼠标/触屏仍可点），
      // 键盘替代入口是页面上的「代我抽牌」按钮（见上方 aria-label）
      tabIndex={-1}
      aria-label={`抽取一张牌（第 ${index + 1} 张）`}
      disabled={disabled || picked}
      onClick={() => onPick(card)}
      className={cn(
        'absolute bottom-0 left-1/2 h-36 w-[5.4rem] -ml-[2.7rem] rounded-xl',
        'sm:h-44 sm:w-28 sm:-ml-14',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        picked ? 'pointer-events-none' : 'cursor-pointer'
      )}
      style={{ transformOrigin: '50% 135%', zIndex: index }}
      initial={reducedMotion ? false : { opacity: 0, rotate: 0 }}
      animate={{ opacity: picked ? 0 : 1, rotate: angle, scale: picked ? 0.7 : 1 }}
      whileHover={picked || disabled ? undefined : { y: -14, scale: 1.04, zIndex: 90 }}
      transition={{
        opacity: { duration: 0.3, ease: EASE.SMOOTH },
        scale: { duration: 0.3, ease: EASE.SMOOTH },
        rotate: {
          duration: 0.5,
          ease: EASE.SNAPPY,
          delay: reducedMotion ? 0 : Math.min(index * 0.006, 0.5),
        },
      }}
    >
      <TarotCardBack />
    </motion.button>
  );
});
