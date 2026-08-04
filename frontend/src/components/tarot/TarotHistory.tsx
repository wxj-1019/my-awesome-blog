'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, History, Trash2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { getSpread, tarotDeck } from '@/mock/tarot';
import { buildReadingEntries, orientationLabel } from '@/lib/tarot';
import { cn } from '@/lib/utils';
import type { TarotHistoryEntry } from '@/lib/tarot-history';

interface TarotHistoryProps {
  entries: TarotHistoryEntry[];
  onClear: () => void;
}

/** 相对/简短时间格式化 */
function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 占卜历史折叠面板：条目列表 + 点击展开该次解读。
 * 数据由父组件管理（localStorage），本组件只负责展示与交互。
 */
export default function TarotHistory({ entries, onClear }: TarotHistoryProps) {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const cardById = useMemo(() => new Map(tarotDeck.map((c) => [c.id, c])), []);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <History className="h-4 w-4" aria-hidden />
        占卜历史（{entries.length}）
        <ChevronDown
          className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="mt-3 space-y-2">
          {entries.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">暂无占卜记录</p>
          ) : (
            entries.map((entry) => {
              const spread = getSpread(entry.spreadType);
              const drawn = entry.drawn
                .map((d) => {
                  const card = cardById.get(d.cardId);
                  return card ? { card, isReversed: d.isReversed } : null;
                })
                .filter((d): d is NonNullable<typeof d> => d !== null);
              const expanded = expandedId === entry.id;
              return (
                <GlassCard key={entry.id} padding="sm" className="py-0">
                  <button
                    type="button"
                    onClick={() => setExpandedId((cur) => (cur === entry.id ? null : entry.id))}
                    aria-expanded={expanded}
                    className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                  >
                    <span className="text-xs text-muted-foreground">{formatTime(entry.createdAt)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {entry.question.trim() || '综合占卜'}
                    </span>
                    <span className="text-xs text-muted-foreground">{spread.name}</span>
                    <span className="flex flex-wrap gap-1">
                      {drawn.map((d) => (
                        <span
                          key={d.card.id}
                          className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
                        >
                          {d.card.name}·{orientationLabel(d.isReversed)}
                        </span>
                      ))}
                    </span>
                    <ChevronDown
                      className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform duration-200', expanded && 'rotate-180')}
                      aria-hidden
                    />
                  </button>

                  {expanded ? (
                    <div className="space-y-2.5 border-t border-border/70 px-4 py-3">
                      {buildReadingEntries(drawn, spread).map(({ position, text }) => (
                        <p key={position} className="text-sm leading-relaxed text-foreground/85">
                          <span className="mr-1.5 font-medium text-primary">{position}</span>
                          {text}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </GlassCard>
              );
            })
          )}

          {entries.length > 0 ? (
            <button
              type="button"
              onClick={onClear}
              className="flex w-full items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground transition-colors hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              清空历史
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
