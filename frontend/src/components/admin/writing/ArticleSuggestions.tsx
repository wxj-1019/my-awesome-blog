'use client';

/**
 * Phase 2 全文建议面板。
 *
 * 流程：
 * 1. 无建议时显示「分析全文」按钮 → analyze(sessionId, content, hash) → onSessionChange。
 * 2. 有建议时逐条渲染为卡片（类型徽标 / 标题 / 原因 / 范围 / 状态）。
 * 3. 点击 pending/previewed 建议 → reviseSuggestion(stream) → 累积预览 → onComplete 后刷新 session。
 * 4. 在 SelectionRevisionPreview 中应用：applyRevision(sessionId, revisionId, hash) → 刷新 session → onApplyRevision。
 * 5. 应用/丢弃后状态固化，禁止重复点击。
 *
 * 冲突检测：建议生成时的 contentHash 与「应用当下」重新计算的 hash 不一致 → conflict=true，
 * 由 SelectionRevisionPreview 阻止应用并提示重新选择。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  Loader2,
  Wand2,
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api-client';
import { contentHash } from '@/lib/content-hash';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/admin/Toast';
import type {
  WritingSession,
  WritingSuggestion,
  WritingRevision,
} from '@/types/writing-session';
import SelectionRevisionPreview from './SelectionRevisionPreview';

export interface ArticleSuggestionsProps {
  suggestions: WritingSuggestion[];
  content: string;
  sessionId: string;
  onSessionChange: (session: WritingSession) => void;
  onApplyRevision: (revision: WritingRevision) => void;
}

/** 类型 → 中文标签 + 配色。 */
const TYPE_LABEL: Record<WritingSuggestion['type'], string> = {
  structure: '结构',
  argument: '论点',
  readability: '可读性',
  seo: 'SEO',
  accuracy: '准确性',
};

/** 状态 → 中文标签 + 配色。 */
const STATUS_LABEL: Record<WritingSuggestion['status'], string> = {
  pending: '待处理',
  previewed: '已预览',
  applied: '已应用',
  dismissed: '已忽略',
};

interface Preview {
  suggestionId: string;
  revisionId: string;
  replacement: string;
  /** 生成预览时记录的正文指纹（同步），用于渲染期冲突检测。 */
  baseFingerprint: string;
}

export default function ArticleSuggestions({
  suggestions,
  content,
  sessionId,
  onSessionChange,
  onApplyRevision,
}: ArticleSuggestionsProps) {
  const { error: toastError, success: toastSuccess } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [streamingSuggestionId, setStreamingSuggestionId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  // 卸载时中止进行中的流
  useEffect(() => () => cancelRef.current?.(), []);

  // 分析全文：调用 analyze → 用返回的 session 更新父级
  const handleAnalyze = useCallback(async () => {
    if (analyzing) {return;}
    setAnalyzing(true);
    setError(null);
    try {
      const hash = await contentHash(content);
      const session = await adminApi.writingSessions.analyze(sessionId, content, hash);
      onSessionChange(session);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '分析失败';
      setError(msg);
      toastError(`分析失败：${msg}`);
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, content, sessionId, onSessionChange, toastError]);

  // 针对某条建议生成修订预览（流式）
  const handleRevise = useCallback(
    (suggestion: WritingSuggestion) => {
      // 已应用 / 已忽略 → 不可再触发
      if (suggestion.status === 'applied' || suggestion.status === 'dismissed') {return;}
      if (streamingSuggestionId) {return;}

      setStreamingSuggestionId(suggestion.id);
      setPreview(null);
      setError(null);

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
        cancelRef.current = adminApi.writingSessions.reviseSuggestion(
          sessionId,
          { suggestion_id: suggestion.id, content, content_hash: baseHash },
          {
            onChunk: (delta) => {
              accumulated += delta;
              setPreview({
                suggestionId: suggestion.id,
                revisionId,
                replacement: accumulated,
                baseFingerprint,
              });
            },
            onMeta: (meta) => {
              const id = typeof meta.revision_id === 'string' ? meta.revision_id : null;
              if (id) {
                revisionId = id;
                setPreview((prev) =>
                  prev ? { ...prev, revisionId: id } : prev
                );
              }
            },
            onComplete: async () => {
              cancelRef.current = null;
              setStreamingSuggestionId(null);
              try {
                const refreshed = await adminApi.writingSessions.get(sessionId);
                onSessionChange(refreshed);
              } catch {
                // 刷新失败不阻塞预览，用户仍可应用
              }
            },
            onError: (msg) => {
              cancelRef.current = null;
              setStreamingSuggestionId(null);
              setPreview(null);
              setError(msg);
              toastError(`生成修订失败：${msg}`);
            },
          }
        );
      })();
    },
    [content, sessionId, streamingSuggestionId, onSessionChange, toastError]
  );

  // 应用预览：重新计算 hash 做冲突检测
  const handleApply = useCallback(async () => {
    if (!preview || !preview.revisionId) {return;}
    setError(null);
    try {
      const currentHash = await contentHash(content);
      const session = await adminApi.writingSessions.applyRevision(
        sessionId,
        preview.revisionId,
        currentHash
      );
      // 把应用到的修订回传父级（取最新 applied 的一项）
      const applied = session.revisions.find(
        (r) => r.id === preview.revisionId
      );
      if (applied) {
        onApplyRevision(applied);
      }
      onSessionChange(session);
      setPreview(null);
      toastSuccess('已应用修改');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '应用失败';
      setError(msg);
      toastError(`应用失败：${msg}`);
    }
  }, [preview, content, sessionId, onApplyRevision, onSessionChange, toastError, toastSuccess]);

  const handleDiscard = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
    setStreamingSuggestionId(null);
    setPreview(null);
  }, []);

  // 冲突检测：当前正文指纹与预览生成时不一致 → 禁止应用
  const conflict = preview
    ? preview.baseFingerprint !== contentHashSync(content)
    : false;

  // 空建议 → 显示「分析全文」入口
  if (suggestions.length === 0) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void handleAnalyze()}
          disabled={analyzing}
          className={cn(
            'w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg',
            'text-xs font-medium',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90 transition-colors',
            'disabled:bg-primary/40 disabled:cursor-not-allowed'
          )}
        >
          {analyzing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          分析全文
        </button>
        {error && (
          <p className="text-[10px] text-destructive">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {suggestions.map((s) => {
        const isStreaming = streamingSuggestionId === s.id;
        const isActivePreview = preview?.suggestionId === s.id;
        const isTerminal = s.status === 'applied' || s.status === 'dismissed';
        return (
          <div
            key={s.id}
            className={cn(
              'rounded-lg border border-border/40 bg-background/30 p-2.5',
              'transition-colors',
              isActivePreview && 'border-primary/40 bg-primary/5',
              isTerminal && 'opacity-60'
            )}
          >
            {/* 头部：类型徽标 + 状态 */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <span
                className={cn(
                  'shrink-0 inline-flex items-center px-1.5 py-0.5 rounded',
                  'text-[10px] font-medium',
                  'bg-foreground/10 text-foreground/70'
                )}
              >
                {TYPE_LABEL[s.type]}
              </span>
              <span
                className={cn(
                  'shrink-0 text-[10px]',
                  s.status === 'applied' && 'text-emerald-500',
                  s.status === 'dismissed' && 'text-foreground/40',
                  (s.status === 'pending' || s.status === 'previewed') && 'text-primary/70'
                )}
              >
                {STATUS_LABEL[s.status]}
              </span>
            </div>

            {/* 标题 */}
            <p className="text-xs font-medium text-foreground leading-snug">{s.title}</p>

            {/* 原因 */}
            {s.reason && (
              <p className="text-[11px] text-foreground/60 mt-1 leading-relaxed">{s.reason}</p>
            )}

            {/* 范围 */}
            {s.scope && (
              <p className="text-[10px] text-foreground/40 mt-1">范围：{s.scope}</p>
            )}

            {/* 触发修订按钮 */}
            {!isTerminal && !isActivePreview && (
              <button
                type="button"
                onClick={() => handleRevise(s)}
                disabled={!!streamingSuggestionId}
                className={cn(
                  'mt-2 w-full inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md',
                  'text-[11px] font-medium',
                  'border border-primary/40 text-primary',
                  'hover:bg-primary/10 transition-colors',
                  'disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              >
                {isStreaming ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3" />
                )}
                {isStreaming ? '生成中…' : '生成修改预览'}
              </button>
            )}

            {/* 该建议的预览 */}
            {isActivePreview && preview && (
              <div className="mt-2">
                <SelectionRevisionPreview
                  originalText={content}
                  replacementText={preview.replacement}
                  revisionId={preview.revisionId || null}
                  conflict={conflict}
                  onApply={() => void handleApply()}
                  onDiscard={handleDiscard}
                />
              </div>
            )}
            {/* 已应用 / 已忽略：状态已在头部徽标展示，此处不再重复 */}
          </div>
        );
      })}

      {error && (
        <p className="text-[10px] text-destructive">{error}</p>
      )}
    </div>
  );
}

/**
 * 同步哈希用于渲染期冲突判断（仅作 UI 提示，真正落库前会再算一次）。
 *
 * 这里不能用 async 的 contentHash（在条件渲染里），所以做一个轻量同步指纹。
 * 仅需要判断「内容是否变了」，不要求密码学强度；用长度 + 头尾采样即可。
 */
function contentHashSync(content: string): string {
  if (content.length === 0) {return '0';}
  const head = content.slice(0, 32);
  const tail = content.slice(-32);
  return `${content.length}:${head}:${tail}`;
}
