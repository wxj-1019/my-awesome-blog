'use client';

/**
 * Phase 2 编辑器右侧 AI 协助总面板（替换旧 AIAssistSidebar）。
 *
 * 三个区域：
 * 1. 可折叠标题「AI 协助」。
 * 2. 选区修订：用户在编辑器选中文字 → 显示选区卡片 + 指令输入 + 「修改此处」
 *    → reviseSelection(stream) → 累积预览 → SelectionRevisionPreview → 应用 / 放弃。
 *    预览期间不直接改写正文，避免破坏式流式。
 * 3. 全文建议（ArticleSuggestions）：分析 / 卡片 / 建议修订预览。
 *
 * 冲突检测：预览生成时记录 contentHash，应用时与当前 content 比较；
 * 与父级编辑器解耦，仅通过 props 读取 selection / content，通过回调上抛修订。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Wand2,
  FileInput,
  Send,
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api-client';
import { contentHash } from '@/lib/content-hash';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/admin/Toast';
import type {
  WritingSession,
  WritingRevision,
} from '@/types/writing-session';
import ArticleSuggestions from './ArticleSuggestions';
import SelectionRevisionPreview from './SelectionRevisionPreview';

export interface EditorSelection {
  text: string;
  start: number;
  end: number;
}

export interface ArticleAIAssistProps {
  sessionId: string;
  content: string;
  selection: EditorSelection;
  session: WritingSession;
  onSessionChange: (session: WritingSession) => void;
  onApplyRevision: (revision: WritingRevision) => void;
  /** 外部繁忙态（其它面板进行中时禁用本面板）。 */
  busy?: boolean;
}

interface SelectionPreview {
  revisionId: string;
  replacement: string;
  /** 生成预览时记录的正文指纹（同步），用于渲染期冲突检测。 */
  baseFingerprint: string;
  originalText: string;
}

export default function ArticleAIAssist({
  sessionId,
  content,
  selection,
  session,
  onSessionChange,
  onApplyRevision,
  busy = false,
}: ArticleAIAssistProps) {
  const { error: toastError, success: toastSuccess } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [modifying, setModifying] = useState(false);
  const [preview, setPreview] = useState<SelectionPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  // 卸载时中止进行中的流
  useEffect(() => () => cancelRef.current?.(), []);

  const hasSelection = selection.text.length > 0;

  // 选区修订：流式生成替换文本，累积进预览
  const handleReviseSelection = useCallback(() => {
    if (!hasSelection || !instruction.trim() || modifying || busy) {return;}

    setModifying(true);
    setPreview(null);
    setError(null);

    const originalText = selection.text;
    let accumulated = '';
    let revisionId = '';
    let baseHash = '';

    // 同步指纹立即可用，用于渲染期冲突判断；真正落库前再用 contentHash 算一次。
    const baseFingerprint = contentHashSync(content);
    void (async () => {
      try {
        baseHash = await contentHash(content);
      } catch {
        baseHash = '';
      }
      cancelRef.current = adminApi.writingSessions.reviseSelection(
        sessionId,
        {
          content,
          selected_text: originalText,
          selection_start: selection.start,
          selection_end: selection.end,
          instruction: instruction.trim(),
          content_hash: baseHash,
        },
        {
          onChunk: (delta) => {
            accumulated += delta;
            setPreview({
              revisionId,
              replacement: accumulated,
              baseFingerprint,
              originalText,
            });
          },
          onMeta: (meta) => {
            const id = typeof meta.revision_id === 'string' ? meta.revision_id : null;
            if (id) {
              revisionId = id;
              setPreview((prev) => (prev ? { ...prev, revisionId: id } : prev));
            }
          },
          onComplete: () => {
            cancelRef.current = null;
            setModifying(false);
          },
          onError: (msg) => {
            cancelRef.current = null;
            setModifying(false);
            setPreview(null);
            setError(msg);
            toastError(`修改失败：${msg}`);
          },
        }
      );
    })();
  }, [
    hasSelection,
    instruction,
    modifying,
    busy,
    selection.text,
    selection.start,
    selection.end,
    content,
    sessionId,
    toastError,
  ]);

  // 应用选区修订
  const handleApply = useCallback(async () => {
    if (!preview || !preview.revisionId) {return;}
    setError(null);
    try {
      const currentHash = await contentHash(content);
      const updated = await adminApi.writingSessions.applyRevision(
        sessionId,
        preview.revisionId,
        currentHash
      );
      const applied = updated.revisions.find((r) => r.id === preview.revisionId);
      if (applied) {
        onApplyRevision(applied);
      }
      onSessionChange(updated);
      setPreview(null);
      setInstruction('');
      toastSuccess('修改已应用');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '应用失败';
      setError(msg);
      toastError(`应用失败：${msg}`);
    }
  }, [preview, content, sessionId, onApplyRevision, onSessionChange, toastError, toastSuccess]);

  const handleDiscard = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
    setModifying(false);
    setPreview(null);
    setInstruction('');
  }, []);

  // 冲突检测：当前正文指纹与预览生成时不一致 → 禁止应用
  const conflict = preview
    ? preview.baseFingerprint !== contentHashSync(content)
    : false;

  const truncate = (s: string, max: number) => (s.length > max ? s.slice(0, max) + '…' : s);

  return (
    <div className="rounded-xl border border-border/40 bg-background/30 overflow-hidden">
      {/* 折叠标题 */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-foreground/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Wand2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">AI 协助</span>
        </div>
        {collapsed ? (
          <ChevronDown className="w-3.5 h-3.5 text-foreground/40" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-foreground/40" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="border-t border-border/30"
          >
            <div className="p-3 space-y-3">
              {/* 选区修订 */}
              {hasSelection ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-foreground/50 flex items-center gap-1">
                    <FileInput className="w-3 h-3" />
                    已选中 {selection.text.length} 字：{truncate(selection.text, 30)}
                  </p>
                  {!preview && (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !modifying && !busy) {
                            e.preventDefault();
                            handleReviseSelection();
                          }
                        }}
                        placeholder="修改此处为…"
                        disabled={modifying || busy}
                        aria-label="选中文字修改指令"
                        className={cn(
                          'flex-1 px-2.5 py-1.5 rounded-lg bg-background/60 border border-border/50',
                          'text-foreground text-xs placeholder:text-foreground/40',
                          'focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40',
                          'transition-colors disabled:cursor-not-allowed'
                        )}
                      />
                      <button
                        type="button"
                        onClick={handleReviseSelection}
                        disabled={!instruction.trim() || modifying || busy}
                        aria-label="修改此处"
                        className={cn(
                          'shrink-0 inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg',
                          'bg-primary text-primary-foreground',
                          'hover:bg-primary/90 disabled:bg-primary/40 disabled:cursor-not-allowed',
                          'text-xs transition-colors'
                        )}
                      >
                        {modifying ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                  {modifying && !preview && (
                    <p className="text-[10px] text-primary/80">AI 正在生成修改预览…</p>
                  )}
                  {preview && (
                    <SelectionRevisionPreview
                      originalText={preview.originalText}
                      replacementText={preview.replacement}
                      revisionId={preview.revisionId || null}
                      conflict={conflict}
                      onApply={() => void handleApply()}
                      onDiscard={handleDiscard}
                    />
                  )}
                  {error && (
                    <p className="text-[10px] text-destructive">{error}</p>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-foreground/50">在编辑器中选中文字后可精准修改</p>
              )}

              {/* 全文建议 */}
              <div className="border-t border-border/20 pt-2 space-y-2">
                <p className="text-[10px] text-foreground/50 flex items-center gap-1">
                  <Wand2 className="w-3 h-3" />
                  全文建议
                </p>
                <ArticleSuggestions
                  suggestions={session.suggestions}
                  content={content}
                  sessionId={sessionId}
                  onSessionChange={onSessionChange}
                  onApplyRevision={onApplyRevision}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * 同步哈希用于渲染期冲突判断（真正落库前会再用 contentHash 算一次发往后端）。
 * 仅做 UI 提示，不要求密码学强度。
 */
function contentHashSync(content: string): string {
  if (content.length === 0) {return '0';}
  const head = content.slice(0, 32);
  const tail = content.slice(-32);
  return `${content.length}:${head}:${tail}`;
}
