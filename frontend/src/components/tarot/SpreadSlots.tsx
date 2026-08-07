'use client';

import type { DrawnCard, TarotSpread } from '@/types/tarot';
import { orientationLabel } from '@/lib/tarot';
import TarotCardBack from './TarotCardBack';
import TarotCardFace from './TarotCardFace';
import TarotFlipCard from './TarotFlipCard';

interface SpreadSlotsProps {
  spread: TarotSpread;
  drawn: DrawnCard[];
  flipped: boolean[];
  onFlip: (index: number) => void;
}

/** 牌位展示：位置标签 + 翻牌卡 + 翻开后显示牌名/朝向（逆位牌倒置呈现） */
export default function SpreadSlots({ spread, drawn, flipped, onFlip }: SpreadSlotsProps) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-3 sm:gap-10">
      {drawn.map((d, i) => (
        <div key={d.card.id} className="flex w-24 flex-col items-center gap-2.5 sm:w-40">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary sm:px-3 sm:py-1 sm:text-xs">
            {spread.positions[i] ?? `第 ${i + 1} 张`}
          </span>
          <TarotFlipCard
            className="aspect-[2/3] w-full"
            flipped={flipped[i] ?? false}
            reversed={d.isReversed}
            onFlip={() => onFlip(i)}
            ariaLabel={`翻开「${spread.positions[i] ?? `第 ${i + 1} 张`}」的牌`}
            back={<TarotCardBack />}
            face={<TarotCardFace card={d.card} />}
          />
          <p className="text-center text-[11px] leading-snug text-muted-foreground sm:text-xs">
            {flipped[i] ? `${d.card.name} · ${orientationLabel(d.isReversed)}` : '点击翻开'}
          </p>
        </div>
      ))}
    </div>
  );
}
