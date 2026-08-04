'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Dices, MoonStar, RotateCcw, Undo2, Wand2 } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import PageHeader from '@/components/layout/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import { FadeIn } from '@/components/motion';
import { motion, useReducedMotion } from '@/lib/framer-motion';
import { EASE } from '@/lib/animation-utils';
import TarotCardBack from '@/components/tarot/TarotCardBack';
import TarotCardFace from '@/components/tarot/TarotCardFace';
import TarotCutDeck from '@/components/tarot/TarotCutDeck';
import TarotDeckFan from '@/components/tarot/TarotDeckFan';
import TarotHistory from '@/components/tarot/TarotHistory';
import TarotLexicon from '@/components/tarot/TarotLexicon';
import TarotOrnament from '@/components/tarot/TarotOrnament';
import TarotStatsBar from '@/components/tarot/TarotStatsBar';
import SpreadSlots from '@/components/tarot/SpreadSlots';
import ReadingPanel from '@/components/tarot/ReadingPanel';
import { useTarotShortcuts } from '@/hooks/useTarotShortcuts';
import { getSpread, tarotDeck, tarotSpreads } from '@/mock/tarot';
import { cutDeck, drawCards, getDailyCard, orientationLabel, randomCutPoint, shuffleDeck } from '@/lib/tarot';
import {
  addHistoryEntry,
  loadHistory,
  saveHistory,
  type TarotHistoryEntry,
} from '@/lib/tarot-history';
import { addStats, emptyStats, loadStats, saveStats, type TarotStats } from '@/lib/tarot-stats';
import { cn } from '@/lib/utils';
import type { DrawnCard, SpreadType, TarotCard, TarotPhase } from '@/types/tarot';

/** 洗牌动画时长（ms），reduced-motion 时近乎跳过 */
const SHUFFLE_MS = 900;
/** 逐张揭示间隔（ms） */
const REVEAL_STEP_MS = 1100;

/** 页面视图：占卜 / 牌义速查 */
type TarotView = 'reading' | 'lexicon';

/**
 * 塔罗占卜页：问牌 → 洗牌 → 切牌 → 抽牌 → 翻牌 → 解读 的状态机编排。
 * 双视图（占卜 / 牌义速查）同时挂载、hidden 切换，切视图不丢占卜进度。
 */
export default function TarotContent() {
  const reducedMotion = useReducedMotion();
  const [view, setView] = useState<TarotView>('reading');
  const [phase, setPhase] = useState<TarotPhase>('ask');
  const [question, setQuestion] = useState('');
  const [spreadType, setSpreadType] = useState<SpreadType>('single');
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [drawn, setDrawn] = useState<DrawnCard[]>([]);
  const [flipped, setFlipped] = useState<boolean[]>([]);
  const [autoRevealing, setAutoRevealing] = useState(false);
  /** 占卜历史（localStorage 持久化） */
  const [history, setHistory] = useState<TarotHistoryEntry[]>(() => loadHistory());
  /** 抽牌统计（localStorage 持久化） */
  const [stats, setStats] = useState<TarotStats>(() => loadStats());
  /** 今日之牌（挂载后赋值，hydration 安全） */
  const [dailyCard, setDailyCard] = useState<DrawnCard | null>(null);
  /** 首次访问引导（localStorage 标记，挂载后读取避免 hydration 不一致） */
  const [showOnboard, setShowOnboard] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 逐张揭示的定时器集合（reset/卸载时统一清理） */
  const revealTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** 解读面板锚点（全部翻开后滚动定位） */
  const readingRef = useRef<HTMLDivElement>(null);

  const spread = getSpread(spreadType);
  const needCount = spread.positions.length;
  const pickedIds = useMemo(() => new Set(drawn.map((d) => d.card.id)), [drawn]);
  const allFlipped = flipped.length > 0 && flipped.every(Boolean);
  /** 抽牌结果稳定签名：避免 drawn 数组引用变化触发 effect 闭包重建 */
  const drawnSignature = useMemo(
    () => drawn.map((d) => `${d.card.id}:${d.isReversed}`).join('|'),
    [drawn]
  );

  const clearTimers = useCallback(() => {
    if (timerRef.current) {clearTimeout(timerRef.current);}
    timerRef.current = null;
    revealTimersRef.current.forEach((t) => clearTimeout(t));
    revealTimersRef.current = [];
  }, []);

  // 卸载时清理定时器
  useEffect(() => clearTimers, [clearTimers]);

  /** 今日之牌：挂载后按当天日期确定性抽取（避免 SSR/CSR 跨天不一致） */
  useEffect(() => {
    setDailyCard(getDailyCard(tarotDeck, new Date()));
    // 首次访问未引导过则展示引导（仅客户端读取 localStorage）
    if (typeof window !== 'undefined' && !window.localStorage.getItem('tarot_onboarded')) {
      setShowOnboard(true);
    }
  }, []);

  /** 关闭引导并标记已读 */
  const dismissOnboard = useCallback(() => {
    setShowOnboard(false);
    try {
      window.localStorage.setItem('tarot_onboarded', '1');
    } catch {
      // 静默降级
    }
  }, []);

  /** 解读完成（全部翻开）时自动保存一次历史与统计；allFlipped 变化只触发一次。
   *  依赖用 drawnSignature（稳定字符串）而非 drawn（数组引用），避免无关重渲重建闭包。 */
  useEffect(() => {
    if (!allFlipped) {return;}
    const entry: TarotHistoryEntry = {
      id:
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      question,
      spreadType,
      drawn: drawn.map((d) => ({ cardId: d.card.id, isReversed: d.isReversed })),
      createdAt: Date.now(),
    };
    setHistory((prev) => {
      const next = addHistoryEntry(prev, entry);
      saveHistory(next);
      return next;
    });
    setStats((prev) => {
      const next = addStats(prev, drawn);
      saveStats(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFlipped, question, spreadType, drawnSignature]);

  /** 以今日之牌占卜：跳过洗牌/切牌/选牌，直接进入该牌揭示 */
  const startWithDaily = useCallback(() => {
    if (!dailyCard) {return;}
    clearTimers();
    setSpreadType('single');
    setDeck([]);
    setDrawn([dailyCard]);
    setFlipped([false]);
    setAutoRevealing(false);
    setPhase('revealing');
  }, [dailyCard, clearTimers]);

  /** 清空占卜历史与统计 */
  const clearHistory = useCallback(() => {
    saveHistory([]);
    setHistory([]);
    saveStats(emptyStats());
    setStats(emptyStats());
  }, []);

  /** 开始占卜：洗牌 → 短暂洗牌动画 → 进入切牌 */
  const startReading = useCallback(() => {
    dismissOnboard();
    setDeck(shuffleDeck(tarotDeck));
    setDrawn([]);
    setFlipped([]);
    setAutoRevealing(false);
    setPhase('shuffling');
    timerRef.current = setTimeout(
      () => setPhase('cutting'),
      reducedMotion ? 120 : SHUFFLE_MS
    );
  }, [reducedMotion, dismissOnboard]);

  /** 切牌：真实改变牌序（数组旋转），动画由 TarotCutDeck 内部完成后回调 */
  const handleCut = useCallback(() => {
    setDeck((prev) => cutDeck(prev, randomCutPoint(prev.length)));
    setPhase('drawing');
  }, []);

  /** 从扇形牌堆选一张（updater 保持纯计算，副作用统一交给下方 effect） */
  const pickCard = useCallback(
    (card: TarotCard) => {
      setDrawn((prev) => {
        if (prev.length >= needCount) {return prev;}
        return [...prev, { card, isReversed: Math.random() >= 0.5 }];
      });
    },
    [needCount]
  );

  /** 误触撤销：移除最后一张 */
  const undoPick = useCallback(() => {
    setDrawn((prev) => prev.slice(0, -1));
  }, []);

  /** 随机补满剩余牌位（复用 lib 的洗牌+逆位逻辑，走同一 phase 切换 effect） */
  const randomPickAll = useCallback(() => {
    setDrawn((prev) => {
      if (prev.length >= needCount) {return prev;}
      const remaining = deck.filter((c) => !prev.some((d) => d.card.id === c.id));
      return [...prev, ...drawCards(remaining, needCount - prev.length)];
    });
  }, [deck, needCount]);

  /** 选满后：设置翻牌状态，延迟切入揭示阶段。
   *  effect 自带 cleanup 清理定时器，StrictMode 双调用也安全（避免泄漏 timer
   *  在「重新开始」后仍触发 phase 切换）。 */
  useEffect(() => {
    if (drawn.length !== needCount) {return;}
    setFlipped(new Array(needCount).fill(false));
    // 给「选中牌淡出」留一点时间再切场景
    const t = setTimeout(() => setPhase('revealing'), reducedMotion ? 80 : 420);
    timerRef.current = t;
    return () => {
      if (timerRef.current === t) {timerRef.current = null;}
      clearTimeout(t);
    };
  }, [drawn.length, needCount, reducedMotion]);

  const flipCard = useCallback((index: number) => {
    setFlipped((prev) => prev.map((v, i) => (i === index ? true : v)));
  }, []);

  const revealAll = useCallback(() => {
    setFlipped((prev) => prev.map(() => true));
  }, []);

  /** 翻开第一张未翻开的牌（快捷键与单张翻转共用） */
  const flipNext = useCallback(() => {
    setFlipped((prev) => {
      const idx = prev.findIndex((v) => !v);
      if (idx === -1) {return prev;}
      return prev.map((v, i) => (i === idx ? true : v));
    });
  }, []);

  /** 逐张揭示：每 REVEAL_STEP_MS 自动翻一张；reduced-motion 直接全部翻开 */
  const revealSequentially = useCallback(() => {
    if (reducedMotion) {
      revealAll();
      return;
    }
    setAutoRevealing(true);
    revealTimersRef.current = Array.from({ length: needCount }, (_, i) =>
      setTimeout(() => {
        setFlipped((prev) => prev.map((v, idx) => (idx === i ? true : v)));
        if (i === needCount - 1) {setAutoRevealing(false);}
      }, REVEAL_STEP_MS + i * REVEAL_STEP_MS)
    );
  }, [needCount, reducedMotion, revealAll]);

  /** 全部翻开后滚动到解读面板（scroll-mt 避开固定 Navbar，不抢首次 reveal） */
  useEffect(() => {
    if (!allFlipped) {return;}
    const t = setTimeout(() => {
      readingRef.current?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }, reducedMotion ? 0 : 350);
    timerRef.current = t;
    return () => {
      if (timerRef.current === t) {timerRef.current = null;}
      clearTimeout(t);
    };
  }, [allFlipped, reducedMotion]);

  /** 重置：回到问牌阶段（保留已输入的问题） */
  const reset = useCallback(() => {
    clearTimers();
    setPhase('ask');
    setDrawn([]);
    setFlipped([]);
    setDeck([]);
    setAutoRevealing(false);
  }, [clearTimers]);

  /** 占卜流程键盘快捷键（弹层由 ReadingPanel/ShareCard 内部管理，这里只接管占卜流程键） */
  useTarotShortcuts({
    phase,
    modalOpen: view !== 'reading',
    onStart: startReading,
    onFlipNext: flipNext,
    onReset: reset,
    onPickSpread: (s) => setSpreadType(s),
  });

  const tabButton = (target: TarotView, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      role="tab"
      aria-selected={view === target}
      onClick={() => setView(target)}
      className={cn(
        'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        view === target
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <PageShell density="default">
      <PageHeader
        title="塔罗牌"
        description="静心、提问、抽牌——78 张韦特塔罗正逆位解读，可选 AI 深度解读"
        icon={MoonStar}
        align="center"
      />

      {/* 视图切换（两面板同时挂载，hidden 切换以保留占卜进度） */}
      <div
        role="tablist"
        aria-label="塔罗页视图"
        className="mx-auto mb-10 flex w-fit gap-1 rounded-full border border-border/60 bg-glass/20 p-1"
      >
        {tabButton('reading', '占卜', <Wand2 className="h-4 w-4" aria-hidden />)}
        {tabButton('lexicon', '牌义速查', <BookOpen className="h-4 w-4" aria-hidden />)}
      </div>

      {/* ===== 占卜视图 ===== */}
      <div className={cn(view === 'reading' ? '' : 'hidden')}>
        <TarotOrnament />

        {/* 问牌 */}
        {phase === 'ask' ? (
          <>
            {/* 首次使用引导 */}
            {showOnboard ? (
              <FadeIn className="mx-auto mb-4 max-w-xl">
                <div className="flex items-center gap-2 rounded-lg border border-tech-purple/30 bg-tech-purple/5 px-4 py-2.5 text-sm text-foreground/85">
                  <Wand2 className="h-4 w-4 shrink-0 text-tech-purple" aria-hidden />
                  <span className="flex-1">
                    输入问题、选择牌阵后开始占卜。也可按
                    <kbd className="mx-1 rounded border border-border bg-card px-1.5 py-0.5 text-[11px]">空格</kbd>
                    快速开始，
                    <kbd className="mx-1 rounded border border-border bg-card px-1.5 py-0.5 text-[11px]">1</kbd>
                    <kbd className="ml-1 rounded border border-border bg-card px-1.5 py-0.5 text-[11px]">2</kbd>
                    切换牌阵。
                  </span>
                  <button
                    type="button"
                    onClick={dismissOnboard}
                    aria-label="关闭引导"
                    className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <RotateCcw className="h-3.5 w-3.5 rotate-45" aria-hidden />
                  </button>
                </div>
              </FadeIn>
            ) : null}

            {/* 今日之牌 */}
            {dailyCard ? (
              <FadeIn className="mx-auto mb-6 max-w-xl">
                <GlassCard padding="md" className="flex items-center gap-4">
                  <div className="w-14 shrink-0">
                    <div className={cn('aspect-[5/8] w-full', dailyCard.isReversed && 'rotate-180')}>
                      <TarotCardFace card={dailyCard.card} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-tech-purple">今日之牌</p>
                    <h2 className="mt-0.5 text-base font-semibold text-foreground">
                      {dailyCard.card.name} · {orientationLabel(dailyCard.isReversed)}
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {dailyCard.isReversed ? dailyCard.card.reversed : dailyCard.card.upright}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={startWithDaily}
                    className="shrink-0 rounded-lg border border-tech-purple/40 px-3 py-1.5 text-xs font-medium text-tech-purple transition-colors hover:bg-tech-purple/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    以此占卜
                  </button>
                </GlassCard>
              </FadeIn>
            ) : null}

            <FadeIn>
              <GlassCard padding="lg" className="mx-auto max-w-xl">
              <label
                htmlFor="tarot-question"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                你的问题（可选）
              </label>
              <textarea
                id="tarot-question"
                rows={2}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={200}
                placeholder="在心中默念一个问题，或留空做一次综合占卜"
                className="mb-5 w-full resize-none rounded-lg border border-input bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />

              <p className="mb-2 text-sm font-medium text-foreground">选择牌阵</p>
              <div className="mb-6 grid grid-cols-1 gap-3 xs:grid-cols-2">
                {tarotSpreads.map((s) => (
                  <button
                    key={s.type}
                    type="button"
                    onClick={() => setSpreadType(s.type)}
                    aria-pressed={spreadType === s.type}
                    className={cn(
                      'rounded-xl border p-3.5 text-left transition-[border-color,background-color] duration-200',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      spreadType === s.type
                        ? 'border-primary/60 bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <span className="mb-1 block text-sm font-semibold text-foreground">
                      {s.name}
                    </span>
                    <span className="block text-xs leading-relaxed text-muted-foreground">
                      {s.description}
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={startReading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Wand2 className="h-4 w-4" aria-hidden />
                开始占卜
              </button>
            </GlassCard>
          </FadeIn>
            </>
        ) : null}

        {/* 洗牌（一次性动画，可跳过） */}
        {phase === 'shuffling' ? (
          <div className="flex flex-col items-center gap-8 py-10" aria-live="polite">
            <div className="relative h-44 w-28">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0"
                  style={{ transformOrigin: '50% 90%' }}
                  initial={false}
                  animate={
                    reducedMotion
                      ? { opacity: 1 }
                      : { rotate: [0, -8 + i * 4, 7 - i * 3, 0], x: [0, -10 + i * 6, 9 - i * 5, 0] }
                  }
                  transition={{ duration: 0.8, ease: EASE.SNAPPY, delay: i * 0.05 }}
                >
                  <TarotCardBack />
                </motion.div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">洗牌中，请默念你的问题…</p>
            <button
              type="button"
              onClick={() => setPhase('cutting')}
              className="text-xs text-muted-foreground/70 underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              跳过动画
            </button>
          </div>
        ) : null}

        {/* 切牌 */}
        {phase === 'cutting' ? (
          <FadeIn>
            <TarotCutDeck onCut={handleCut} />
          </FadeIn>
        ) : null}

        {/* 抽牌 */}
        {phase === 'drawing' ? (
          <FadeIn className="flex flex-col items-center gap-5">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              凭直觉点击牌背，选出 <span className="font-semibold text-primary">{needCount}</span> 张牌
              <span className="ml-2 text-xs">
                （已选 {drawn.length} / {needCount}）
              </span>
            </p>
            <TarotDeckFan
              deck={deck}
              pickedIds={pickedIds}
              onPick={pickCard}
              disabled={drawn.length >= needCount}
            />
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={randomPickAll}
                disabled={drawn.length >= needCount}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                <Dices className="h-4 w-4" aria-hidden />
                代我抽牌
              </button>
              {drawn.length > 0 ? (
                <button
                  type="button"
                  onClick={undoPick}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Undo2 className="h-4 w-4" aria-hidden />
                  撤销上一张
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              重新开始
            </button>
          </FadeIn>
        ) : null}

        {/* 翻牌与解读 */}
        {phase === 'revealing' ? (
          <FadeIn className="flex flex-col items-center gap-8">
            <SpreadSlots spread={spread} drawn={drawn} flipped={flipped} onFlip={flipCard} />

            {!allFlipped ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={revealSequentially}
                  disabled={autoRevealing}
                  aria-live="polite"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
                >
                  {autoRevealing ? '揭示中…' : '逐张揭示'}
                </button>
                <button
                  type="button"
                  onClick={revealAll}
                  disabled={autoRevealing}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
                >
                  全部翻开
                </button>
              </div>
            ) : (
              <div ref={readingRef} className="w-full scroll-mt-24">
                <FadeIn className="w-full">
                  <ReadingPanel question={question} spread={spread} drawn={drawn} onReset={reset} />
                </FadeIn>
              </div>
            )}

            {/* 抽牌统计 */}
            <div className="w-full">
              <TarotStatsBar stats={stats} />
            </div>

            {/* 占卜历史 */}
            <div className="w-full">
              <TarotHistory entries={history} onClear={clearHistory} />
            </div>
          </FadeIn>
        ) : null}
      </div>

      {/* ===== 牌义速查视图 ===== */}
      <div className={cn(view === 'lexicon' ? '' : 'hidden')}>
        <TarotLexicon />
      </div>
    </PageShell>
  );
}
