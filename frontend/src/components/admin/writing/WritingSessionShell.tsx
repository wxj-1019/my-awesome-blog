'use client';

/**
 * Phase 1 写作会话编排器：管理「澄清 → 大纲 → 初稿」全生命周期。
 *
 * 状态机：
 *   loading        → 挂载时拉取活动会话
 *   resume-choice  → 存在活动会话，让用户选「继续 / 新建」
 *   session        → 进入阶段对应视图（ClarificationChat / OutlineReview / drafting loading / DraftReview）
 *
 * 流式要点（沿用 AIWritingPanel 的可靠模式）：
 * - rAF 节流累加 chunk，避免每 token 全量重渲染；
 * - cancelRef 保存当前流的 cancel 函数，卸载 / 切流时中止；
 * - 每次 onComplete 都从服务端刷新整条 session，拿到持久化后的权威状态；
 * - streamingRef 守卫 stale-closure 窗口，堵住「连点」。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, RotateCcw, FileText, Sparkles, PenLine } from 'lucide-react';
import { adminApi, type SseHandlers } from '@/lib/admin-api-client';
import type { WritingMessage, WritingSession, WritingStage } from '@/types/writing-session';
import WritingProgress from './WritingProgress';
import ClarificationChat from './ClarificationChat';
import OutlineReview from './OutlineReview';
import DraftReview from './DraftReview';

export interface WritingSessionShellProps {
  /** 初稿确认后回调，把草稿与完整 session 交给父组件进入编辑器。 */
  onDraftConfirmed: (draft: string, session: WritingSession) => void;
}

type View = 'loading' | 'resume-choice' | 'session';

export default function WritingSessionShell({ onDraftConfirmed }: WritingSessionShellProps) {
  const [view, setView] = useState<View>('loading');
  const [session, setSession] = useState<WritingSession | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [readyForOutline, setReadyForOutline] = useState(false);
  // 累加流式正文（live preview）；streamTarget 决定它显示在哪个区域
  const [streamContent, setStreamContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false); // 非流式按钮的进行中态（生成大纲 / 确认初稿）

  const cancelRef = useRef<(() => void) | null>(null);
  const streamingRef = useRef(false);
  // 流式当前作用于哪个区域：clarify 对话 / outline 文档或对话 / draft 对话
  const [streamTarget, setStreamTarget] = useState<
    'clarify' | 'outline-doc' | 'outline-chat' | 'draft-chat' | null
  >(null);

  // ── 初始化：拉取活动会话 ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const active = await adminApi.writingSessions.active();
        if (cancelled) {return;}
        setSession(active);
        // 仍处于 Phase 1（editing 之前）→ 给用户选择继续 / 新建
        if (active.stage === 'editing' || active.stage === 'completed') {
          // 已完成 Phase 1，直接当作新会话处理
          const fresh = await adminApi.writingSessions.create();
          if (cancelled) {return;}
          setSession(fresh);
          setView('session');
        } else {
          setView('resume-choice');
        }
      } catch (err) {
        if (cancelled) {return;}
        const status = (err as { status?: number }).status;
        if (status === 404) {
          // 无活动会话 → 直接新建
          try {
            const fresh = await adminApi.writingSessions.create();
            if (cancelled) {return;}
            setSession(fresh);
            setView('session');
          } catch (createErr) {
            if (cancelled) {return;}
            setError(createErr instanceof Error ? createErr.message : '创建会话失败');
          }
        } else {
          setError(getErrorMessage(err, '加载会话失败'));
        }
      }
    })();
    return () => {
      cancelled = true;
      cancelRef.current?.();
      cancelRef.current = null;
    };
  }, []);

  // ── 流式 chunk 累加（rAF 节流）──────────────────────────────
  const streamBufferRef = useRef('');
  const rafScheduledRef = useRef(false);
  const flushStream = useCallback(() => {
    rafScheduledRef.current = false;
    if (!streamBufferRef.current) {return;}
    const delta = streamBufferRef.current;
    streamBufferRef.current = '';
    setStreamContent(prev => prev + delta);
  }, []);

  const startStream = useCallback((
    target: 'clarify' | 'outline-doc' | 'outline-chat' | 'draft-chat',
    run: (handlers: SseHandlers) => (() => void)
  ) => {
    // 中止任何在途流
    cancelRef.current?.();
    streamBufferRef.current = '';
    setStreamContent('');
    setStreamTarget(target);
    streamingRef.current = true;
    setStreaming(true);

    const onChunk = (delta: string) => {
      streamBufferRef.current += delta;
      if (!rafScheduledRef.current) {
        rafScheduledRef.current = true;
        requestAnimationFrame(flushStream);
      }
    };
    const finishStream = () => {
      // flush 残留 chunk（pending rAF 的回调未必先于此处执行，手动兜底）
      if (rafScheduledRef.current) {
        rafScheduledRef.current = false;
        if (streamBufferRef.current) {
          const delta = streamBufferRef.current;
          streamBufferRef.current = '';
          setStreamContent(prev => prev + delta);
        }
      }
      streamingRef.current = false;
      setStreaming(false);
      cancelRef.current = null;
    };
    const onComplete = async () => {
      finishStream();
      // 刷新整条 session 拿持久化后的权威状态
      const sid = session?.id;
      if (sid) {
        try {
          const fresh = await adminApi.writingSessions.get(sid);
          setSession(fresh);
        } catch {
          // 刷新失败不阻塞：本地 streamContent 仍可用
        }
      }
      // 清理 live preview（已落到 session.messages / outline / draft）
      streamBufferRef.current = '';
      setStreamContent('');
      setStreamTarget(null);
    };
    const onError = (msg: string) => {
      finishStream();
      setError(msg);
      streamBufferRef.current = '';
      setStreamContent('');
      setStreamTarget(null);
    };

    cancelRef.current = run({ onChunk, onComplete, onError });
  }, [flushStream, session]);

  // ── 澄清阶段：发送消息 ──────────────────────────────────────
  const handleClarifySend = useCallback((message: string) => {
    if (!session) {return;}
    startStream('clarify', handlers =>
      adminApi.writingSessions.messageStream(session.id, message, {
        ...handlers,
        onMeta: (meta) => {
          handlers.onMeta?.(meta);
          if (meta.ready_for_outline === true) {
            setReadyForOutline(true);
          }
        },
      })
    );
  }, [session, startStream]);

  // ── 生成大纲（非流式）──────────────────────────────────────
  const handleGenerateOutline = useCallback(async () => {
    if (!session || busy) {return;}
    setBusy(true);
    setError(null);
    try {
      const fresh = await adminApi.writingSessions.generateOutline(session.id);
      setSession(fresh);
      setReadyForOutline(false);
    } catch (err) {
      setError(getErrorMessage(err, '生成大纲失败'));
    } finally {
      setBusy(false);
    }
  }, [session, busy]);

  // ── 大纲调整（流式：输出新大纲，显示在文档区 live preview）──
  const handleOutlineAdjust = useCallback((message: string) => {
    if (!session) {return;}
    // 调整大纲走 adjustOutline（非流式 Promise）；它返回更新后的 session。
    // 为兼容 spec 描述的「流式反馈」，这里仍刷新 session。
    setBusy(true);
    adminApi.writingSessions.adjustOutline(session.id, message)
      .then(fresh => setSession(fresh))
      .catch(err => setError(getErrorMessage(err, '调整大纲失败')))
      .finally(() => setBusy(false));
  }, [session]);

  // ── 确认大纲（流式：初稿 chunk 流入，显示在文档区 live preview）──
  const handleConfirmOutline = useCallback(() => {
    if (!session || streamingRef.current) {return;}
    setError(null);
    // confirmOutline 的 SSE 正文就是初稿本身；先把 stage 切到 drafting 视觉态
    startStream('outline-doc', handlers =>
      adminApi.writingSessions.confirmOutline(session.id, handlers)
    );
  }, [session, startStream]);

  // ── 初稿调整（流式：输出调整反馈，显示在初稿审阅的对话区）─
  const handleDraftAdjust = useCallback((message: string) => {
    if (!session) {return;}
    startStream('draft-chat', handlers =>
      adminApi.writingSessions.adjustDraft(session.id, message, handlers)
    );
  }, [session, startStream]);

  // ── 确认初稿（非流式）→ 进入编辑器 ─────────────────────────
  const handleConfirmDraft = useCallback(async () => {
    if (!session || busy || streamingRef.current) {return;}
    setBusy(true);
    setError(null);
    try {
      const result = await adminApi.writingSessions.confirmDraft(session.id);
      onDraftConfirmed(result.draft, result);
    } catch (err) {
      setError(getErrorMessage(err, '确认初稿失败'));
    } finally {
      setBusy(false);
    }
  }, [session, busy, onDraftConfirmed]);

  // ── 中止当前流 ─────────────────────────────────────────────
  const handleStop = useCallback(() => {
    cancelRef.current?.();
  }, []);

  // ── 新建会话（在 resume-choice 中点「开始新文章」）─────────
  const handleStartNew = useCallback(async () => {
    if (!session) {return;}
    setBusy(true);
    setError(null);
    try {
      await adminApi.writingSessions.abandon(session.id);
      const fresh = await adminApi.writingSessions.create();
      setSession(fresh);
      setReadyForOutline(false);
      setView('session');
    } catch (err) {
      setError(getErrorMessage(err, '新建会话失败'));
    } finally {
      setBusy(false);
    }
  }, [session]);

  // ── 渲染分支 ───────────────────────────────────────────────
  // 初始加载出错（还没拿到任何 session）→ 展示全屏错误 + 重试。
  // 注意：必须在 loading 判断之前，否则加载失败时 view 仍是 'loading' 会卡在转圈。
  if (error && !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <div className="p-3 rounded-full bg-destructive/10">
          <AlertCircle className="w-6 h-6 text-destructive" />
        </div>
        <p className="text-sm text-foreground/70 max-w-sm">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          重试
        </button>
      </div>
    );
  }

  if (view === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-foreground/60">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm">加载写作会话…</p>
      </div>
    );
  }

  if (view === 'resume-choice' && session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 py-8">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">发现一个未完成的写作会话</h2>
          <p className="text-sm text-foreground/50">
            上次停在了「{stageLabel(session.stage)}」阶段，要继续还是重新开始？
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <button
            type="button"
            onClick={() => setView('session')}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-semibold"
          >
            <PenLine className="w-4 h-4" />
            继续上次写作
          </button>
          <button
            type="button"
            onClick={handleStartNew}
            disabled={busy}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-foreground/5 text-foreground hover:bg-foreground/10 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            开始新文章
          </button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-foreground/60">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm">准备中…</p>
      </div>
    );
  }

  // session 视图
  const stage: WritingStage = session.stage;
  const draftPreview = streaming && streamTarget === 'outline-doc' ? streamContent : '';

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <WritingProgress stage={stage} />

      {error && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-destructive/60 hover:text-destructive"
            aria-label="关闭错误提示"
          >
            ×
          </button>
        </div>
      )}

      {stage === 'clarifying' && (
        <ClarificationChat
          messages={filterClarifyMessages(session.messages)}
          streaming={streaming}
          readyForOutline={readyForOutline}
          streamContent={streamTarget === 'clarify' ? streamContent : ''}
          onSend={handleClarifySend}
          onGenerateOutline={handleGenerateOutline}
          onStop={handleStop}
        />
      )}

      {stage === 'outline_review' && !(streaming && streamTarget === 'outline-doc') && (
        <OutlineReview
          outline={session.outline}
          messages={filterStageMessages(session.messages, 'outline_review')}
          streaming={streaming || busy}
          onAdjust={handleOutlineAdjust}
          onConfirm={handleConfirmOutline}
        />
      )}

      {(stage === 'drafting' || (stage === 'outline_review' && streaming && streamTarget === 'outline-doc')) && (
        <div className="flex flex-col flex-1 min-h-0 items-center justify-center gap-4 text-center">
          <div className="p-3 rounded-2xl bg-primary/10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">正在生成初稿…</p>
            <p className="text-xs text-foreground/50 mt-1">AI 正在根据大纲撰写正文，请稍候</p>
          </div>
          {draftPreview && (
            <div className="w-full max-w-2xl max-h-[40vh] overflow-y-auto rounded-xl border border-border/50 bg-background/40 p-4 text-left">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap break-words">
                <DraftPlainText text={draftPreview} />
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleStop}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-xs"
          >
            停止生成
          </button>
        </div>
      )}

      {stage === 'draft_review' && (
        <DraftReview
          draft={session.draft}
          messages={filterStageMessages(session.messages, 'draft_review')}
          streaming={streaming}
          streamContent={streamTarget === 'draft-chat' ? streamContent : ''}
          onAdjust={handleDraftAdjust}
          onConfirm={handleConfirmDraft}
        />
      )}

      {stage === 'editing' && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-foreground/60">
          <p className="text-sm">此会话已进入编辑阶段。</p>
        </div>
      )}
    </div>
  );
}

// ── 辅助：阶段标签 ─────────────────────────────────────────────
function stageLabel(stage: WritingStage): string {
  switch (stage) {
    case 'clarifying': {return '澄清需求';}
    case 'outline_review': {return '确认大纲';}
    case 'drafting': {return '生成初稿';}
    case 'draft_review': {return '确认初稿';}
    case 'editing': {return '编辑';}
    case 'completed': {return '已完成';}
    default: {return stage;}
  }
}

/**
 * 统一错误信息提取。ApiError 已是 Error 子类（见 admin-api-client.ts），
 * 但 SSE / 第三方错误形状不一，这里仍对任意形状优先取 .message，兜底更稳。
 */
function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === 'string' && msg) {return msg;}
  }
  if (typeof err === 'string' && err) {return err;}
  return fallback;
}

/**
 * 从持久化 messages 里筛出澄清阶段（最早 outline_review 之前）的对话。
 * 当前后端 WritingMessage 未带 stage 字段，这里保守地：澄清阶段把全部消息展示给用户。
 * 进入大纲 / 初稿阶段后用 filterStageMessages 按时间窗口或约定切分。
 */
function filterClarifyMessages(messages: WritingMessage[]): WritingMessage[] {
  // 澄清阶段：展示所有 user/assistant 消息（后端尚未细分阶段，全量呈现即可）
  return messages.filter(m => m.role === 'user' || m.role === 'assistant');
}

/**
 * 大纲 / 初稿审阅阶段的「调整对话」：后端 WritingMessage 暂无阶段标记，
 * 这里返回全部 user/assistant 消息作为调整对话（与澄清一致，后续后端补充阶段字段后可精确切分）。
 */
function filterStageMessages(messages: WritingMessage[], _stage: 'outline_review' | 'draft_review'): WritingMessage[] {
  void _stage;
  return messages.filter(m => m.role === 'user' || m.role === 'assistant');
}

/** 流式初稿预览：暂以纯文本展示（避免半截 Markdown 反复重渲染抖动）。 */
function DraftPlainText({ text }: { text: string }) {
  return <span className="text-foreground/80 leading-relaxed">{text}</span>;
}
