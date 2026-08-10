'use client';

import { memo, useDeferredValue, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, Star, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from '@/lib/framer-motion';
import { EASE } from '@/lib/animation-utils';
import { filterTarotCards, toRomanNumeral } from '@/lib/tarot';
import { tarotDeck } from '@/mock/tarot';
import { loadFavorites, saveFavorites, toggleFavorite } from '@/lib/tarot-favorites';
import { useInViewport } from '@/hooks/useInViewport';
import { cn } from '@/lib/utils';
import type { TarotCard, TarotSuit } from '@/types/tarot';
import TarotCardImage from './TarotCardImage';
import TarotGlyph from './TarotGlyph';

/** 分组标签与配色（token 分类色板，与牌面保持一致） */
const GROUP_META: Record<'major' | TarotSuit, { label: string; text: string }> = {
  major: { label: '大阿尔克那', text: 'text-tech-purple' },
  wands: { label: '权杖', text: 'text-cat-4' },
  cups: { label: '圣杯', text: 'text-cat-1' },
  swords: { label: '宝剑', text: 'text-cat-5' },
  pentacles: { label: '星币', text: 'text-cat-8' },
};

type LexiconGroup = 'major' | TarotSuit;
const GROUPS = Object.keys(GROUP_META) as LexiconGroup[];

/** 宫廷牌徽标字 */
const COURT_LABEL: Record<string, string> = {
  page: '侍',
  knight: '骑',
  queen: '后',
  king: '王',
};

/** 条目头部编号：大牌罗马数字、数字牌阿拉伯数字、宫廷牌徽标字 */
function entryNumeral(card: TarotCard): string {
  if (card.arcana === 'major') {return toRomanNumeral(card.number);}
  if (card.court) {return COURT_LABEL[card.court] ?? '';}
  return String(card.number);
}

/**
 * 牌义速查馆：按大阿尔克那/四花色分组浏览 78 张牌，支持搜索与展开详情。
 * 搜索优先于分组（搜索时展示全部匹配）；展开用 opacity/translateY 渐显（禁 height 动画）。
 */
export default function TarotLexicon() {
  const [group, setGroup] = useState<LexiconGroup>('major');
  const [query, setQuery] = useState('');
  /** 搜索防抖：useDeferredValue 让输入响应优先、过滤延迟到空闲帧（零依赖、SSR 安全） */
  const deferredQuery = useDeferredValue(query);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  /** 收藏牌 id 列表（localStorage 持久化） */
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());
  /** 只看收藏开关 */
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  const searchActive = deferredQuery.trim() !== '';

  const visibleCards = useMemo(() => {
    let cards: TarotCard[];
    if (searchActive) {
      cards = filterTarotCards(tarotDeck, deferredQuery);
    } else {
      cards = tarotDeck.filter((c) =>
        group === 'major' ? c.arcana === 'major' : c.suit === group
      );
    }
    return onlyFavorites ? cards.filter((c) => favoritesSet.has(c.id)) : cards;
  }, [group, deferredQuery, searchActive, onlyFavorites, favoritesSet]);

  /** 切换收藏（同步写 localStorage） */
  const handleToggleFavorite = (cardId: string) => {
    setFavorites((prev) => {
      const next = toggleFavorite(prev, cardId);
      saveFavorites(next);
      return next;
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* 搜索 + 只看收藏 */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索牌名或关键词，如「月亮」「财运」"
            aria-label="搜索牌义"
            className="min-h-11 w-full rounded-lg border border-input bg-background/60 py-2 pl-9 pr-14 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="清空搜索"
              className="absolute right-2 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setOnlyFavorites((v) => !v)}
          aria-pressed={onlyFavorites}
          aria-label="只看收藏"
          className={cn(
            'flex min-h-11 shrink-0 items-center gap-1 rounded-lg border px-3 py-2 text-xs transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            onlyFavorites
              ? 'border-warning/50 bg-warning/10 text-warning'
              : 'border-border text-muted-foreground hover:border-warning/40 hover:text-warning'
          )}
        >
          <Star className={cn('h-3.5 w-3.5', onlyFavorites && 'fill-current')} aria-hidden />
          收藏
        </button>
      </div>

      {/* 分组 */}
      <div
        className={cn(
          'mb-5 flex flex-wrap justify-center gap-2',
          searchActive && 'pointer-events-none opacity-50'
        )}
        role="group"
        aria-label="按分组浏览"
      >
        {GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroup(g)}
            aria-pressed={group === g}
            className={cn(
              'min-h-11 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              group === g
                ? 'bg-primary/15 text-primary'
                : 'border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            )}
          >
            {GROUP_META[g].label}
          </button>
        ))}
      </div>

      {searchActive ? (
        <p className="mb-3 text-center text-xs text-muted-foreground">
          找到 {visibleCards.length} 张牌
        </p>
      ) : null}

      {/* 列表 */}
      {visibleCards.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">没有匹配的牌</p>
      ) : (
        <ul className="space-y-1.5">
          {visibleCards.map((card) => (
            <LexiconEntry
              key={card.id}
              card={card}
              expanded={expandedId === card.id}
              isFavorite={favoritesSet.has(card.id)}
              onToggle={() => setExpandedId((cur) => (cur === card.id ? null : card.id))}
              onToggleFavorite={() => handleToggleFavorite(card.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

interface LexiconEntryProps {
  card: TarotCard;
  expanded: boolean;
  isFavorite: boolean;
  onToggle: () => void;
  onToggleFavorite: () => void;
}

/** 单条占位高度（px）：未进入视口时用固定高度占位，避免滚动抖动 */
const ENTRY_PLACEHOLDER_HEIGHT = 64;

/**
 * 单张牌条目：外层 li 始终挂载（承担 IntersectionObserver 观察），
 * 内容仅在进入视口（或 IO 不可用降级）时渲染，屏外条目不占渲染开销。
 */
const LexiconEntry = memo(function LexiconEntry({
  card,
  expanded,
  isFavorite,
  onToggle,
  onToggleFavorite,
}: LexiconEntryProps) {
  const ref = useRef<HTMLLIElement>(null);
  const inViewport = useInViewport(ref);

  return (
    <li
      ref={ref}
      style={inViewport ? undefined : { height: ENTRY_PLACEHOLDER_HEIGHT }}
      className={cn(
        'rounded-xl border border-border bg-card/70 backdrop-blur-sm transition-colors',
        inViewport && 'hover:border-primary/30'
      )}
    >
      {inViewport ? (
        <LexiconEntryInner
          card={card}
          expanded={expanded}
          isFavorite={isFavorite}
          onToggle={onToggle}
          onToggleFavorite={onToggleFavorite}
        />
      ) : null}
    </li>
  );
});

interface LexiconEntryInnerProps {
  card: TarotCard;
  expanded: boolean;
  isFavorite: boolean;
  onToggle: () => void;
  onToggleFavorite: () => void;
}

/** 条目内容：头部（编号+符号+名称+关键词+收藏），展开显示正/逆位详情与元数据 */
function LexiconEntryInner({
  card,
  expanded,
  isFavorite,
  onToggle,
  onToggleFavorite,
}: LexiconEntryInnerProps) {
  const reducedMotion = useReducedMotion();
  const meta = card.arcana === 'major' ? GROUP_META.major : GROUP_META[card.suit as TarotSuit];

  return (
    <>
      <div className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`${card.name} 详情`}
          className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
        >
          <span className={cn('shrink-0 text-muted-foreground text-xs w-7 text-center', meta.text)}>
            {entryNumeral(card)}
          </span>
          {/* 列表缩略图：AI 生成牌面图优先，失败回退花色符号 */}
          <span className="h-9 w-6 shrink-0 overflow-hidden rounded-sm border border-border/60">
            <TarotCardImage
              card={card}
              className="h-full w-full"
              fallback={
                <span className={cn('flex h-full w-full items-center justify-center', meta.text)}>
                  <TarotGlyph glyph={card.arcana === 'major' ? card.glyph : (card.suit ?? 'pentacles')} className="h-5 w-5" />
                </span>
              }
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">
              {card.name}
              {/* 英文牌名：UnifrakturMaguntia 哥特体 */}
              <span className="ml-1.5 font-gothic text-xs font-normal text-muted-foreground">{card.nameEn}</span>
            </span>
            <span className="mt-0.5 flex flex-wrap gap-1">
              {card.keywords.map((kw) => (
                <span key={kw} className="text-[11px] text-muted-foreground/80">
                  {kw}
                </span>
              ))}
            </span>
          </span>
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200', expanded && 'rotate-180')}
            aria-hidden
          />
        </button>
        {/* 收藏星标 */}
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `取消收藏${card.name}` : `收藏${card.name}`}
          className={cn(
            'flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isFavorite ? 'text-warning hover:text-warning/80' : 'text-muted-foreground/50 hover:text-warning'
          )}
        >
          <Star className={cn('h-4 w-4', isFavorite && 'fill-current')} aria-hidden />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="detail"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.24, ease: EASE.SMOOTH }}
            className="border-t border-border/70 px-4 py-3"
          >
            {/* 展开大图：AI 生成牌面图（竖版 2:3），失败回退花色符号 */}
            <div className="mb-3 flex justify-center">
              <div className="aspect-[2/3] w-32 overflow-hidden rounded-lg border border-border/70 shadow-sm">
                <TarotCardImage
                  card={card}
                  className="h-full w-full"
                  fallback={
                    <span className={cn('flex h-full w-full items-center justify-center', meta.text)}>
                      <TarotGlyph glyph={card.arcana === 'major' ? card.glyph : (card.suit ?? 'pentacles')} className="h-14 w-14" />
                    </span>
                  }
                />
              </div>
            </div>

            {/* 元数据徽标：元素 · 占星 */}
            {card.element || card.astrology ? (
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {card.element ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                    {card.element}元素
                  </span>
                ) : null}
                {card.astrology ? (
                  <span className="rounded-full bg-tech-purple/10 px-2 py-0.5 text-[11px] text-tech-purple">
                    {card.astrology}
                  </span>
                ) : null}
              </div>
            ) : null}
            <p className="mb-2 flex gap-2 text-sm leading-relaxed text-foreground/85">
              <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                正位
              </span>
              <span>{card.upright}</span>
            </p>
            <p className="flex gap-2 text-sm leading-relaxed text-foreground/85">
              <span className="shrink-0 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                逆位
              </span>
              <span>{card.reversed}</span>
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
