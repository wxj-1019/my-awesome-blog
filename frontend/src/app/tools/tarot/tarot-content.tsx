'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Dices, MoonStar, RotateCcw, Undo2, Wand2 } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import PageActHeader from '@/components/layout/PageActHeader';
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
import TarotStepper from '@/components/tarot/TarotStepper';
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
  /** 分享弹层开关（提升到页面级：弹层打开时快捷键让位，Esc 只关弹层不重置占卜） */
  const [shareOpen, setShareOpen] = useState(false);
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

  /** 进入切牌阶段：先清除洗牌 timer，防止跳过动画后旧 timer 把流程改回切牌 */
  const goToCutting = useCallback(() => {
    if (timerRef.current) {clearTimeout(timerRef.current);}
    timerRef.current = null;
    setPhase('cutting');
  }, []);

  // 卸载时清理定时器
  useEffect(() => clearTimers, [clearTimers]);

  /** 今日之牌：挂载后按当天日期确定性抽取（避免 SSR/CSR 跨天不一致） */
  useEffect(() => {
    setDailyCard(getDailyCard(tarotDeck, new Date()));
    // 首次访问未引导过则展示引导（仅客户端读取 localStorage；读取抛异常时按未引导处理）
    let onboarded = false;
    if (typeof window !== 'undefined') {
      try {
        onboarded = !!window.localStorage.getItem('tarot_onboarded');
      } catch {
        // 隐私模式等场景 localStorage 不可用，降级为未引导（引导可关闭，不影响使用）
      }
    }
    if (!onboarded) {
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
    timerRef.current = setTimeout(goToCutting, reducedMotion ? 120 : SHUFFLE_MS);
  }, [reducedMotion, dismissOnboard, goToCutting]);

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
    // 给「选中牌淡出」留一点时间再切场景（流程计时常量 420ms，非视觉过渡令牌；
    // reduced-motion 缩短为 80ms 仅保证状态可感知）
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

  /** 全部翻开后滚动到解读面板（scroll-mt 避开固定 Navbar；350ms 为流程计时——
   *  等末张翻牌动画稳定再滚动，不抢首次 reveal，非视觉过渡令牌） */
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

  /** 占卜流程键盘快捷键（分享弹层打开或切到速查视图时让位，弹层 Esc 由 ShareCard 自行处理） */
  useTarotShortcuts({
    phase,
    modalOpen: shareOpen || view !== 'reading',
    onStart: startReading,
    onFlipNext: flipNext,
    onReset: reset,
    onPickSpread: (s) => setSpreadType(s),
  });

  /** 视图顺序：左右方向键循环切换的基准 */
  const viewOrder: TarotView[] = ['reading', 'lexicon'];
  /** 两个 Tab 按钮的 ref（方向键切换后手动聚焦新激活 Tab） */
  const tabRefs = useRef<Partial<Record<TarotView, HTMLButtonElement | null>>>({});
  /** Tab 方向键导航：左右循环切换视图并移动焦点（roving tabindex，仅激活 Tab 可 Tab 到） */
  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {return;}
      const idx = viewOrder.indexOf(view);
      const next =
        e.key === 'ArrowRight'
          ? viewOrder[(idx + 1) % viewOrder.length]
          : viewOrder[(idx - 1 + viewOrder.length) % viewOrder.length];
      e.preventDefault();
      setView(next);
      tabRefs.current[next]?.focus();
    },
    [view]
  );

  const tabButton = (target: TarotView, label: string, icon: React.ReactNode) => (
    <button
      ref={(el) => {tabRefs.current[target] = el;}}
      type="button"
      role="tab"
      id={`tab-${target}`}
      aria-selected={view === target}
      aria-controls={`panel-${target}`}
      tabIndex={view === target ? 0 : -1}
      onClick={() => setView(target)}
      className={cn(
        'flex items-center gap-1.5 rounded-full px-4 py-2.5 min-h-11 text-sm font-medium transition-colors',
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
      {/* 轻量返回路径：紧凑面包屑，键盘可达，回到百宝箱 */}
      <div className="mb-6 flex justify-center">
        <Link
          href="/tools"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          百宝箱 / 塔罗占卜
        </Link>
      </div>

      {/* 幕标式页头（PageActHeader 自带 FadeIn；className 覆盖为 token 色，浅色模式可读） */}
      <PageActHeader
        kicker="塔罗占卜 · TAROT"
        title="塔罗占卜"
        description="抽牌占卜，正逆位牌义与 AI 深度解读"
        icon={MoonStar}
        align="center"
        className="[&_[data-act-kicker]]:text-primary [&_h1]:text-foreground [&_p]:text-muted-foreground"
      />

      {/* 视图切换（两面板同时挂载，hidden 切换以保留占卜进度） */}
      <div
        role="tablist"
        aria-label="塔罗页视图"
        onKeyDown={handleTabKeyDown}
        className="mx-auto mb-10 flex w-fit gap-1 rounded-full border border-border/60 bg-glass/20 p-1"
      >
        {tabButton('reading', '占卜', <Wand2 className="h-4 w-4" aria-hidden />)}
        {tabButton('lexicon', '牌义速查', <BookOpen className="h-4 w-4" aria-hidden />)}
      </div>

      {/* ===== 占卜视图 ===== */}
      <div
        id="panel-reading"
        role="tabpanel"
        aria-labelledby="tab-reading"
        className={cn(view === 'reading' ? '' : 'hidden')}
      >
        <TarotOrnament />

        {/* 四步进度（移动端）：顶部横向紧凑条，lg 起移入左侧垂直轨 */}
        <div className="mx-auto mb-6 max-w-xl lg:hidden">
          <TarotStepper phase={phase} compact />
        </div>

        {/* lg+ 三栏：左侧垂直进度侧轨 + 主流程 + 右侧历史栏 */}
        <div className="lg:grid lg:grid-cols-[170px_minmax(0,1fr)_260px] xl:grid-cols-[170px_minmax(0,1fr)_280px] lg:gap-6 max-w-6xl xl:max-w-7xl mx-auto">
          <div className="hidden lg:block">
            <div className="lg:sticky lg:top-24">
              <TarotStepper phase={phase} />
            </div>
          </div>

          <div className="mx-auto min-w-0 w-full max-w-3xl">

            {/* 问牌 */}
            {phase === 'ask' ? (
              <>
              {/* 今日之牌：辅助入口（低于问牌主卡的视觉权重，移动端允许说明换行） */}
              {dailyCard ? (
                <FadeIn className="mb-5">
                  <GlassCard
                    padding="sm"
                    className="flex items-center gap-3 rounded-xl sm:gap-4"
                  >
                    <div className="w-12 shrink-0 sm:w-14">
                      <div className={cn('aspect-[2/3] w-full', dailyCard.isReversed && 'rotate-180')}>
                        <TarotCardFace card={dailyCard.card} />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium tracking-wide text-tech-purple sm:text-xs">
                        今日之牌
                      </p>
                      <h2 className="mt-0.5 truncate text-sm font-semibold text-foreground sm:text-base">
                        {dailyCard.card.name} · {orientationLabel(dailyCard.isReversed)}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
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
                <GlassCard padding="lg">
                {/* 首次使用引导：并入主卡顶部，不占用主流程视觉权重 */}
                {showOnboard ? (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-tech-purple/30 bg-tech-purple/5 px-3.5 py-2.5 text-xs leading-relaxed text-foreground/85 sm:text-sm">
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
                      className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <RotateCcw className="h-3.5 w-3.5 rotate-45" aria-hidden />
                    </button>
                  </div>
                ) : null}

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

                <p className="mb-2 text-sm font-medium text-foreground">
                  选择牌阵
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    （{tarotSpreads.length} 种，选满后自动进入翻牌）
                  </span>
                </p>
                <div className="mb-6 grid grid-cols-1 gap-3 xs:grid-cols-2">
                  {tarotSpreads.map((s) => (
                    <button
                      key={s.type}
                      type="button"
                      onClick={() => setSpreadType(s.type)}
                      aria-pressed={spreadType === s.type}
                      className={cn(
                        'group rounded-xl border p-3.5 text-left transition-[border-color,background-color] duration-200',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        spreadType === s.type
                          ? 'border-primary/60 bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      )}
                    >
                      <span className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        {s.name}
                        <span
                          aria-hidden
                          className={cn(
                            'rounded-full px-1.5 py-px text-[10px] font-medium',
                            spreadType === s.type
                              ? 'bg-primary/15 text-primary'
                              : 'bg-muted/60 text-muted-foreground'
                          )}
                        >
                          {s.positions.length} 张
                        </span>
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
                  className="flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                {/* 洗牌振荡 0.8s（SNAPPY）+ i*0.05 延迟编排在 SHUFFLE_MS(900ms) 窗口内完成：
                    属流程计时常量而非视觉令牌（换 TRANSITION.SLOW 0.85s 会随延迟超出窗口，
                    末张动画在阶段切换时被截断） */}
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
                onClick={goToCutting}
                className="inline-flex min-h-11 items-center text-xs text-muted-foreground/70 underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  凭直觉点击牌背，选出
                  <span className="font-semibold text-primary">{needCount}</span>
                  张牌
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs tabular-nums text-primary" aria-live="polite">
                  已选 {drawn.length} / {needCount}
                </span>
              </div>
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
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                >
                  <Dices className="h-4 w-4" aria-hidden />
                  代我抽牌
                </button>
                {drawn.length > 0 ? (
                  <button
                    type="button"
                    onClick={undoPick}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Undo2 className="h-4 w-4" aria-hidden />
                    撤销上一张
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                重新开始
              </button>
            </FadeIn>
          ) : null}

          {/* 翻牌与解读 */}
          {phase === 'revealing' ? (
            <FadeIn className="flex flex-col items-center gap-8">
              {/* 翻牌结果播报区（视觉隐藏；仅翻牌改变时内容变化触发 aria-live，
                  解读面板/历史/统计挂载不在此区域内，避免整段播报） */}
              <p className="sr-only" aria-live="polite">
                {drawn
                  .map((d, i) =>
                    flipped[i]
                      ? `${spread.positions[i] ?? `第 ${i + 1} 张`}：${d.card.name} · ${orientationLabel(d.isReversed)}`
                      : ''
                  )
                  .filter(Boolean)
                  .join('，')}
              </p>
              <SpreadSlots spread={spread} drawn={drawn} flipped={flipped} onFlip={flipCard} />

              {!allFlipped ? (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={revealSequentially}
                    disabled={autoRevealing}
                    aria-live="polite"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-primary/40 px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
                  >
                    {autoRevealing ? '揭示中…' : '逐张揭示'}
                  </button>
                  <button
                    type="button"
                    onClick={revealAll}
                    disabled={autoRevealing}
                    className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
                  >
                    全部翻开
                  </button>
                </div>
              ) : (
                <div ref={readingRef} className="w-full scroll-mt-24">
                  {/* 解读上下文：牌阵 + 问题（轻量标题，AI 解读前先给结果定位） */}
                  <div className="mx-auto mb-4 w-full max-w-2xl">
                    <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
                        {spread.name} · {spread.positions.length} 张
                      </span>
                      {question.trim() ? (
                        <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-border/70 px-2.5 py-1">
                          <Wand2 className="h-3 w-3 shrink-0 text-tech-purple" aria-hidden />
                          <span className="truncate">{question.trim()}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-border/70 px-2.5 py-1">
                          综合占卜
                        </span>
                      )}
                    </p>
                  </div>
                  <FadeIn className="w-full">
                    <ReadingPanel
                      question={question}
                      spread={spread}
                      drawn={drawn}
                      onReset={reset}
                      shareOpen={shareOpen}
                      onShareOpenChange={setShareOpen}
                    />
                  </FadeIn>
                </div>
              )}

              {/* 抽牌统计 */}
              <div className="w-full">
                <TarotStatsBar stats={stats} />
              </div>

              {/* 占卜历史（移动端显示，lg+移入右侧栏） */}
              <div className="w-full lg:hidden">
                <TarotHistory entries={history} onClear={clearHistory} />
              </div>
            </FadeIn>
          ) : null}
          </div>

          {/* 右侧历史栏（lg+显示，sticky；移动端隐藏，历史在 StatsBar 下方） */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <TarotHistory entries={history} onClear={clearHistory} />
            </div>
          </div>
        </div>
      </div>

      {/* ===== 牌义速查视图 ===== */}
      <div
        id="panel-lexicon"
        role="tabpanel"
        aria-labelledby="tab-lexicon"
        className={cn(view === 'lexicon' ? '' : 'hidden')}
      >
        <TarotLexicon />
      </div>
    </PageShell>
  );
}
