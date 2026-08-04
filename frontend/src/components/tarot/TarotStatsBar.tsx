'use client';

import { memo } from 'react';
import { TrendingUp } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { tarotDeck } from '@/mock/tarot';
import { computeTopCards } from '@/lib/tarot-stats';
import { cn } from '@/lib/utils';
import type { TarotStats } from '@/lib/tarot-stats';
import type { TarotSuit } from '@/types/tarot';
import TarotGlyph from './TarotGlyph';

interface TarotStatsBarProps {
  stats: TarotStats;
}

/** 花色符号色（与牌面保持一致） */
const SUIT_TEXT: Record<'major' | TarotSuit, string> = {
  major: 'text-tech-purple',
  wands: 'text-cat-4',
  cups: 'text-cat-1',
  swords: 'text-cat-5',
  pentacles: 'text-cat-8',
};

/**
 * 抽牌统计小卡：总占卜次数 + 最常出现的牌 top3 + 正逆位比例条。
 * 数据由父组件从 localStorage 读取。
 */
const TarotStatsBar = memo(function TarotStatsBar({ stats }: TarotStatsBarProps) {
  const top = computeTopCards(stats, 3);
  const total = stats.orientation.upright + stats.orientation.reversed;
  const uprightPct = total > 0 ? Math.round((stats.orientation.upright / total) * 100) : 0;

  return (
    <GlassCard padding="md" className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {/* 总次数 */}
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
          <span className="text-sm text-muted-foreground">占卜</span>
          <span className="text-lg font-semibold text-foreground">{stats.totalReadings}</span>
          <span className="text-sm text-muted-foreground">次</span>
        </div>

        {/* 最常出现的牌 */}
        {top.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">最常出现</span>
            {top.map(({ cardId, count }, i) => {
              const card = tarotDeck.find((c) => c.id === cardId);
              if (!card) {return null;}
              const textClass = SUIT_TEXT[card.arcana === 'major' ? 'major' : (card.suit ?? 'major')];
              return (
                <span key={cardId} className="inline-flex items-center gap-1">
                  {i > 0 ? <span className="text-muted-foreground/40">·</span> : null}
                  <TarotGlyph glyph={card.arcana === 'major' ? card.glyph : (card.suit ?? 'pentacles')} className={cn('h-4 w-4', textClass)} />
                  <span className="text-xs text-foreground/85">{card.name}</span>
                  <span className="text-[11px] text-muted-foreground">×{count}</span>
                </span>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* 正逆位比例条 */}
      {total > 0 ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">正逆位</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-success"
              style={{ width: `${uprightPct}%` }}
              aria-label={`正位 ${uprightPct}%`}
            />
          </div>
          <span className="text-xs text-success">{uprightPct}%</span>
          <span className="text-xs text-muted-foreground/60">/</span>
          <span className="text-xs text-warning">{100 - uprightPct}%</span>
        </div>
      ) : null}
    </GlassCard>
  );
});

export default TarotStatsBar;
