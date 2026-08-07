'use client';

import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** 三节点步进条：排队 → 生成 → 完成。activeIndex: 0 排队 / 1 生成 / 2 已完成 */
interface ProgressStepsProps {
  activeIndex: 0 | 1 | 2;
  /** 当前阶段描述（role=status 供辅助技术播报） */
  statusText: string;
}

const STEPS = ['排队', '生成', '完成'] as const;

/**
 * 生成过程阶段进度条：节点状态 = 完成（勾）/ 激活（旋转指示） / 未到。
 * 只动 opacity/transform；旋转动画在 reduced-motion 下由 motion-reduce 关闭。
 */
export default function ProgressSteps({
  activeIndex,
  statusText,
}: ProgressStepsProps) {
  return (
    <div role="group" aria-label="生成进度" className="w-full">
      <ol className="flex items-center">
        {STEPS.map((label, i) => {
          // 末节点「完成」到达即视为已完成：activeIndex=2 时全流程结束，无激活节点
          const isDone =
            i < activeIndex || (i === activeIndex && i === STEPS.length - 1);
          const isActive = i === activeIndex && !isDone;
          return (
            <li
              key={label}
              aria-current={isActive ? 'step' : undefined}
              className={cn(
                'flex items-center',
                i < STEPS.length - 1 && 'flex-1'
              )}
            >
              <span className="flex flex-col items-center gap-1.5">
                <span
                  aria-hidden
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border text-xs transition-colors',
                    isDone && 'border-primary/60 bg-primary/10 text-primary',
                    isActive &&
                      'border-primary bg-primary text-primary-foreground',
                    !isDone &&
                      !isActive &&
                      'border-border text-muted-foreground/60'
                  )}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : isActive ? (
                    <Loader2
                      className="h-4 w-4 animate-spin motion-reduce:animate-none"
                      aria-hidden
                    />
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={cn(
                    'text-xs',
                    isActive
                      ? 'font-medium text-primary'
                      : isDone
                        ? 'text-foreground'
                        : 'text-muted-foreground/60'
                  )}
                >
                  {label}
                </span>
              </span>
              {i < STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    'mx-2 h-px flex-1 transition-colors',
                    i < activeIndex ? 'bg-primary/60' : 'bg-border'
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p
        role="status"
        className="mt-3 text-center text-sm text-muted-foreground"
      >
        {statusText}
      </p>
    </div>
  );
}
