'use client';

import { memo } from 'react';
import { TrendingUp } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { tarotDeck } from '@/mock/tarot';
import { computeTopCards } from '@/lib/tarot-stats';
import { cn } from '@/lib/utils';
import type { TarotStats } from '@/lib/tarot-stats';
import type { TarotSuit } from '@/types/tarot';
import TarotCardImage from './TarotCardImage';
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
                  {/* 统计缩略图：AI 生成牌面图优先，失败回退花色符号 */}
                  <span className="h-5 w-3.5 shrink-0 overflow-hidden rounded-[2px] border border-border/60">
                    <TarotCardImage
                      card={card}
                      className="h-full w-full"
                      fallback={
                        <span className={cn('flex h-full w-full items-center justify-center', textClass)}>
                          <TarotGlyph glyph={card.arcana === 'major' ? card.glyph : (card.suit ?? 'pentacles')} className="h-3 w-3" />
                        </span>
                      }
                    />
                  </span>
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
            {/* 比例条纯装饰：数值已由右侧「76% / 24%」文本朗读，无需重复标注；
                无 role 的 div 上加 aria-label 会被 axe 判为 aria-prohibited-attr（serious） */}
            <div
              className="h-full rounded-full bg-success"
              style={{ width: `${uprightPct}%` }}
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
