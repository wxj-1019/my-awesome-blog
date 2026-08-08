'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/** 占卜阶段：问牌 → 洗切 → 抽牌 → 解读（切牌并入洗切、翻牌并入抽牌） */
type TarotPhase = 'ask' | 'shuffling' | 'cutting' | 'drawing' | 'revealing' | 'reading';

interface TarotStepperProps {
  /** 当前阶段 */
  phase: TarotPhase;
  /** 横向紧凑模式（移动端顶部）；默认 false = 桌面左侧垂直时间线 */
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

/** 圆点标记：已完成=实心+勾 / 活跃=实心+光环 / 未到=描边。非交互，仅展示 */
function Marker({ done, active, index }: { done: boolean; active: boolean; index: number }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs transition-colors duration-200',
        active && 'bg-primary text-primary-foreground ring-4 ring-primary/15',
        done && 'bg-primary text-primary-foreground',
        !active && !done && 'border border-border bg-card text-muted-foreground'
      )}
    >
      {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}
    </span>
  );
}

/**
 * 塔罗四步进程条：线性、单向、只标记完成态（不可回跳）。
 * 桌面为左侧垂直时间线（圆点 + 向下连接线）；移动端为横向轨道（圆点 + 进度条）。
 * 当前步 aria-current="step"；状态由圆点与轨道颜色表达，不再用独立方块/辉光块。
 */
export default function TarotStepper({ phase, compact = false }: TarotStepperProps) {
  const current = phaseIndex(phase);
  const progressPct =
    compact ? (current / (STEPS.length - 1)) * 75 : 0; // 移动端进度条宽度（轨道占 75%）

  if (compact) {
    return (
      <ol
        aria-label="占卜进度"
        className="relative m-0 flex w-full max-w-md list-none items-start p-0"
      >
        {/* 背景轨道：从首个圆点中心到末个圆点中心（4 等分列 → 中心位于 12.5% 与 87.5%） */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-3.5 h-0.5 -translate-y-1/2 rounded-full bg-border"
          style={{ left: '12.5%', width: '75%' }}
        />
        {/* 进度填充：随当前阶段推进 */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-3.5 h-0.5 -translate-y-1/2 rounded-full bg-primary/50 transition-[width] duration-300"
          style={{ left: '12.5%', width: `${progressPct}%` }}
        />
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li
              key={step.key}
              aria-current={active ? 'step' : undefined}
              className="relative z-10 flex flex-1 flex-col items-center gap-1.5"
            >
              <Marker done={done} active={active} index={i} />
              <span
                className={cn(
                  'text-xs leading-none transition-colors',
                  active ? 'font-semibold text-primary' : done ? 'text-foreground/80' : 'text-muted-foreground/70'
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

  // 桌面垂直时间线
  return (
    <nav aria-label="占卜进度" className="flex flex-col">
      <p className="mb-4 pl-10 text-[11px] font-medium tracking-[0.2em] text-muted-foreground/70">
        占卜进度
      </p>
      <ol className="m-0 flex list-none flex-col p-0">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const isLast = i === STEPS.length - 1;
          return (
            <li
              key={step.key}
              aria-current={active ? 'step' : undefined}
              className="flex gap-3"
            >
              {/* 左列：圆点 + 向下连接线（连接线填充到下一圆点，形成连贯轨道） */}
              <div className="flex flex-col items-center">
                <Marker done={done} active={active} index={i} />
                {!isLast ? (
                  <span
                    aria-hidden
                    className={cn(
                      'my-1 w-px flex-1 transition-colors duration-300',
                      done ? 'bg-primary/40' : 'bg-border'
                    )}
                  />
                ) : null}
              </div>
              {/* 右列：标题 + 步骤要点（末步不留底部间距，避免轨道下方空白） */}
              <div className={cn('flex flex-col', isLast ? 'pb-0' : 'pb-5')}>
                <span
                  className={cn(
                    'text-sm leading-tight transition-colors',
                    active ? 'font-semibold text-primary' : done ? 'font-medium text-foreground/85' : 'text-muted-foreground/70'
                  )}
                >
                  {step.label}
                </span>
                <span
                  className={cn(
                    'mt-0.5 text-[11px] leading-tight transition-colors',
                    active ? 'text-primary/70' : 'text-muted-foreground/55'
                  )}
                >
                  {step.sub}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
