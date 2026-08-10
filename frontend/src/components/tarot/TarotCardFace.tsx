import { memo } from 'react';
import type { TarotCard } from '@/types/tarot';
import { cn } from '@/lib/utils';
import TarotCardImage from './TarotCardImage';
import TarotGlyph from './TarotGlyph';

/** 宫廷牌徽标字（SVG 回退场景用） */
const COURT_BADGE: Record<string, string> = {
  page: '侍',
  knight: '骑',
  queen: '后',
  king: '王',
};

interface TarotCardFaceProps {
  card: TarotCard;
  className?: string;
}

/** 牌面：AI 生成牌面图全幅展示（无编号/牌名文字，保持牌面纯净） */
const TarotCardFace = memo(function TarotCardFace({ card, className }: TarotCardFaceProps) {
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card p-1.5',
        className
      )}
    >
      {/* 内框装饰线 */}
      <div
        className="pointer-events-none absolute inset-1 rounded-lg border border-border/60"
        aria-hidden
      />

      {/* 中央图案：AI 生成图全幅（加载失败回退 SVG 符号） */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <TarotCardImage card={card} className="h-full max-h-full w-full" fallback={<SvgMotif card={card} />} />
      </div>
    </div>
  );
});

export default TarotCardFace;

/** 原有 SVG 符号中央图案：按牌型分派（AI 图缺失时的回退） */
function SvgMotif({ card }: { card: TarotCard }) {
  if (card.arcana === 'major') {
    return <TarotGlyph glyph={card.glyph} className="h-14 w-14" />;
  }

  if (card.court) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px] font-semibold">
          {COURT_BADGE[card.court]}
        </span>
        <TarotGlyph glyph={card.glyph} className="h-10 w-10" />
      </div>
    );
  }

  // 数字牌：花色符号 × N，数量越多单枚越小
  const n = card.number;
  const size = n <= 2 ? 'h-9 w-9' : n <= 4 ? 'h-7 w-7' : n <= 6 ? 'h-6 w-6' : 'h-5 w-5';
  return (
    <div className="flex max-w-[5.5rem] flex-wrap items-center justify-center gap-x-1 gap-y-1">
      {Array.from({ length: n }, (_, i) => (
        <TarotGlyph key={i} glyph={card.glyph} className={size} />
      ))}
    </div>
  );
}
