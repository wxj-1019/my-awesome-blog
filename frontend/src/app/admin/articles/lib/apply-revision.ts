import type { Dispatch, SetStateAction } from 'react';
import type { WritingRevision } from '@/types/writing-session';

/**
 * 编辑器共享工具：AI 改稿修订（applyRevision）相关纯函数。
 * 供 new/page.tsx 与 [id]/page.tsx 两个编辑器页面复用，保持行为一致。
 */

/** 将 content 的 [start, end) 区间替换为 text（光标插值逻辑）。 */
export function replaceRange(
  content: string,
  start: number,
  end: number,
  text: string
): string {
  return content.substring(0, start) + text + content.substring(end);
}

/**
 * ArticleAIAssist 的 onApplyRevision 共享实现。
 *
 * - 选段修改：用 revision 的 replacement_text 替换选区区间；
 * - 全文建议：后端 revision 不存 replacement_text，用本地预览全文整篇替换；
 * - 其余来源直接忽略（与原先内联 handler 一致，不触碰脏标记）。
 *
 * 所需 setState 以参数传入，保持与原 handler 完全相同的行为。
 */
export function applyRevisionToForm<T extends { content: string }>(
  revision: WritingRevision,
  replacement: string | undefined,
  setFormData: Dispatch<SetStateAction<T>>,
  setTouchedFields: Dispatch<SetStateAction<Set<string>>>,
  setHasUnsavedChanges: (value: boolean) => void
): void {
  if (revision.source === 'selection') {
    setFormData(prev => ({
      ...prev,
      content: replaceRange(
        prev.content,
        revision.selection_start,
        revision.selection_end,
        revision.replacement_text
      ),
    }));
  } else if (revision.source === 'suggestion' && replacement) {
    // 全文建议：后端 revision 不存 replacement_text，用本地预览全文整篇替换
    setFormData(prev => ({ ...prev, content: replacement }));
  } else {
    return;
  }
  setTouchedFields(prev => new Set(prev).add('content'));
  setHasUnsavedChanges(true);
}
