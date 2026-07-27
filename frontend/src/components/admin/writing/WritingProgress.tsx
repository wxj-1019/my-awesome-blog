'use client';

/**
 * Phase 1 写作流程四步进度条：澄清需求 → 确认大纲 → 确认初稿 → 编辑发布。
 *
 * 阶段映射：
 * - clarifying / outline_review / draft_review / editing / completed 各自落到对应步骤；
 * - drafting（流式生成初稿期间）视觉上停在「确认初稿」步骤，与用户预期一致。
 *
 * 已完成步骤用 success 色 + 勾号；当前步骤用 primary 高亮；未来步骤弱化。
 */
import { cn } from '@/lib/utils';
import type { WritingStage } from '@/types/writing-session';

const STEPS = [
  { key: 'clarifying', label: '澄清需求' },
  { key: 'outline_review', label: '确认大纲' },
  { key: 'draft_review', label: '确认初稿' },
  { key: 'editing', label: '编辑发布' },
] as const;

export interface WritingProgressProps {
  stage: WritingStage;
}

export default function WritingProgress({ stage }: WritingProgressProps) {
  // completed 时全部已完成，视觉上落到最后一步
  const currentIndex = stage === 'completed' ? 3 : STEPS.findIndex(s => s.key === stage);
  // drafting（初稿流式中）视觉上停在 draft_review 步骤（索引 2）
  const activeIndex = stage === 'drafting' ? 2 : currentIndex;

  return (
    <div className="flex items-center gap-1 sm:gap-2 mb-6">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1">
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors',
            i < activeIndex && 'bg-success/10 text-success',
            i === activeIndex && 'bg-primary text-primary-foreground',
            i > activeIndex && 'text-foreground/40'
          )} aria-current={i === activeIndex ? 'step' : undefined}>
            <span className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
              i < activeIndex && 'bg-success text-success-foreground',
              i === activeIndex && 'bg-primary-foreground/30 text-primary-foreground',
              i > activeIndex && 'bg-foreground/10 text-foreground/50'
            )}>
              {i < activeIndex ? '✓' : i + 1}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn('h-px flex-1 mx-1', i < activeIndex ? 'bg-success/40' : 'bg-border/40')} />
          )}
        </div>
      ))}
    </div>
  );
}
