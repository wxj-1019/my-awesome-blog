import { memo } from 'react';
import type { TarotCard } from '@/types/tarot';
import { toRomanNumeral } from '@/lib/tarot';
import { cn } from '@/lib/utils';
import TarotCardImage from './TarotCardImage';
import TarotGlyph from './TarotGlyph';

/** 花色配色：全部走 token 分类色板（双主题自适应），大阿尔克那用神秘紫 */
const SUIT_META: Record<string, { text: string; tintVar: string }> = {
  major: { text: 'text-tech-purple', tintVar: '--tech-purple' },
  wands: { text: 'text-cat-4', tintVar: '--cat-4' },
  cups: { text: 'text-cat-1', tintVar: '--cat-1' },
  swords: { text: 'text-cat-5', tintVar: '--cat-5' },
  pentacles: { text: 'text-cat-8', tintVar: '--cat-8' },
};

/** 宫廷牌徽标字 */
const COURT_BADGE: Record<string, string> = {
  page: '侍',
  knight: '骑',
  queen: '后',
  king: '王',
};

/** 牌面顶部编号：大牌罗马数字、数字牌阿拉伯数字、宫廷牌徽标字 */
function topLabel(card: TarotCard): string {
  if (card.arcana === 'major') {return toRomanNumeral(card.number);}
  if (card.court) {return COURT_BADGE[card.court];}
  return String(card.number);
}

interface TarotCardFaceProps {
  card: TarotCard;
  className?: string;
}

/**
 * SVG 符号化牌面：边框 + 顶部编号 + 中央符号 + 底部牌名。
 * 大阿尔克那单个大符号；数字牌花色符号 ×N；宫廷牌徽标 + 花色符号。
 */
const TarotCardFace = memo(function TarotCardFace({ card, className }: TarotCardFaceProps) {
  const meta = SUIT_META[card.arcana === 'major' ? 'major' : (card.suit ?? 'major')];

  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col items-center justify-between overflow-hidden rounded-xl border border-border bg-card p-2',
        className
      )}
      style={{
        background: `radial-gradient(circle at 50% 42%, color-mix(in srgb, var(${meta.tintVar}) 9%, transparent), transparent 72%)`,
      }}
    >
      {/* 内框装饰线 */}
      <div
        className="pointer-events-none absolute inset-1 rounded-lg border border-border/60"
        aria-hidden
      />

      <span className="self-start pl-1 text-[10px] font-semibold tracking-widest text-muted-foreground">
        {topLabel(card)}
      </span>

      <div className={cn('flex min-h-0 flex-1 items-center justify-center py-1', meta.text)}>
        <CenterMotif card={card} />
      </div>

      <span className="text-[11px] font-medium leading-tight text-foreground/90">
        {card.name}
      </span>
    </div>
  );
});

export default TarotCardFace;

/** 中央图案：AI 生成图优先（加载失败回退 SVG 符号） */
function CenterMotif({ card }: { card: TarotCard }) {
  return <TarotCardImage card={card} className="h-full max-h-full w-full" fallback={<SvgMotif card={card} />} />;
}

/** 原有 SVG 符号中央图案：按牌型分派 */
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
