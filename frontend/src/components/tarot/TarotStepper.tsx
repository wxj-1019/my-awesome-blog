'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/** 占卜阶段：问牌 → 洗切 → 抽牌 → 解读（切牌并入洗切、翻牌并入抽牌） */
type TarotPhase = 'ask' | 'shuffling' | 'cutting' | 'drawing' | 'revealing' | 'reading';

interface TarotStepperProps {
  /** 当前阶段 */
  phase: TarotPhase;
  /** 横向紧凑模式（移动端顶部）；默认 false = 桌面左侧垂直模式 */
  compact?: boolean;
}

/** 四步定义：label 与阶段一一对应，相邻阶段合并为同一步；sub 为步骤要点提示 */
const STEPS = [
  { key: 'ask', label: '问牌', sub: '问题 · 牌阵' },
  { key: 'shuffling', label: '洗切', sub: '洗牌 · 切牌' },
  { key: 'drawing', label: '抽牌', sub: '选牌 · 翻牌' },
  { key: 'reading', label: '解读', sub: '牌义 · AI' },
] as const;

/** 阶段 → 步骤序号（0 起）：洗牌/切牌同为第 2 步，抽牌/翻牌同为第 3 步 */
const phaseIndex = (phase: TarotPhase): number =>
  phase === 'ask' ? 0
    : phase === 'shuffling' || phase === 'cutting' ? 1
    : phase === 'drawing' || phase === 'revealing' ? 2
    : 3;

/**
 * 塔罗四步进程条：线性、单向、只标记完成态（不可回跳）。
 * compact（移动端）：横向四段；桌面：左侧垂直轨。
 * 每步触控目标 ≥44px；当前步 aria-current="step"。
 */
export default function TarotStepper({ phase, compact = false }: TarotStepperProps) {
  const current = phaseIndex(phase);
  return (
    <ol
      aria-label="占卜进度"
      className={cn('m-0 flex list-none p-0', compact ? 'flex-row items-center gap-1' : 'flex-col gap-1')}
    >
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={step.key}
            aria-current={active ? 'step' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3',
              compact ? 'min-h-11' : 'min-h-14 flex-col items-start justify-center gap-0.5',
              active && 'border border-primary/40 bg-primary/10 text-primary shadow-[0_0_12px_var(--glass-glow)]',
              done && 'text-muted-foreground',
              !active && !done && 'text-muted-foreground/60'
            )}
          >
            {done ? (
              <Check className={cn('shrink-0', compact ? 'h-4 w-4' : 'h-3.5 w-3.5')} aria-hidden />
            ) : (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px]">
                {i + 1}
              </span>
            )}
            <span className={cn('leading-tight', compact ? 'text-xs' : 'text-sm font-medium')}>
              {step.label}
            </span>
            {!compact ? (
              <span
                className={cn(
                  'pl-0.5 text-[11px] leading-tight',
                  active ? 'text-primary/80' : 'text-muted-foreground/70'
                )}
              >
                {step.sub}
              </span>
            ) : null}
            {compact && i < STEPS.length - 1 ? (
              <span className="h-px flex-1 bg-border" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
