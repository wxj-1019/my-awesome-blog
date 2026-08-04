'use client';

/**
 * Phase 2 选区修订预览组件。
 *
 * 与旧的 AIAssistSidebar 的「流式直接覆盖正文」不同，这里先把替换文本以预览形式展示，
 * 由用户点「应用替换」才真正落库；并且通过 `conflict` 标记阻止在正文已变化后应用过期修订。
 *
 * 三种状态：
 * 1. conflict === true  → 显示「正文已变化」警告 + 「重新选择段落」按钮（调用 onDiscard）。
 * 2. revisionId 为空    → 视为尚未生成（调用方自行控制是否渲染本组件）。
 * 3. 正常               → 上方原文（删除线/弱化）、下方替换文本（高亮），底部「应用替换 / 放弃」。
 */
import { Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectionRevisionPreviewProps {
  /** 原始选区文本（删除线展示）。 */
  originalText: string;
  /** AI 产出的替换文本（高亮展示）。 */
  replacementText: string;
  /** 本次修订的 id；为空表示尚未生成，调用方一般不应渲染本组件。 */
  revisionId: string | null;
  /** 正文自修订生成后是否已变化；为 true 时禁止应用。 */
  conflict: boolean;
  /** 应用替换。 */
  onApply: () => void;
  /** 放弃 / 重新选择段落。 */
  onDiscard: () => void;
}

export default function SelectionRevisionPreview({
  originalText,
  replacementText,
  revisionId,
  conflict,
  onApply,
  onDiscard,
}: SelectionRevisionPreviewProps) {
  // 冲突：正文已变化，无法安全应用
  if (conflict) {
    return (
      <div
        className={cn(
          'rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5',
          'flex items-start gap-2'
        )}
        role="alert"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
            正文已变化，无法应用此修改
          </p>
          <button
            type="button"
            onClick={onDiscard}
            className={cn(
              'mt-1.5 inline-flex items-center gap-1 px-2 py-1 rounded-md',
              'text-[11px] font-medium',
              'bg-background/60 border border-border/40 text-foreground/80',
              'hover:bg-foreground/5 transition-colors'
            )}
          >
            重新选择段落
          </button>
        </div>
      </div>
    );
  }

  // 正常预览
  return (
    <div className="space-y-2">
      {/* 原文 */}
      <div className="rounded-md border border-border/30 bg-background/30 p-2">
        <p className="text-[10px] text-foreground/40 mb-1">原文</p>
        <p
          className={cn(
            'text-[11px] leading-relaxed whitespace-pre-wrap break-words',
            'text-foreground/50 line-through'
          )}
        >
          {originalText}
        </p>
      </div>

      {/* 替换文本 */}
      <div className="rounded-md border border-primary/30 bg-primary/5 p-2">
        <p className="text-[10px] text-primary/70 mb-1">替换为</p>
        <p
          className={cn(
            'text-[11px] leading-relaxed whitespace-pre-wrap break-words',
            'text-foreground'
          )}
        >
          {replacementText}
        </p>
      </div>

      {/* 操作 */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onApply}
          disabled={!revisionId}
          className={cn(
            'flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md',
            'text-[11px] font-medium',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90 transition-colors',
            'disabled:bg-primary/40 disabled:cursor-not-allowed'
          )}
        >
          <Check className="w-3 h-3" />
          应用替换
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className={cn(
            'inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md',
            'text-[11px] font-medium',
            'border border-border/40 text-foreground/70 bg-transparent',
            'hover:bg-foreground/5 transition-colors'
          )}
        >
          <X className="w-3 h-3" />
          放弃
        </button>
      </div>
    </div>
  );
}
