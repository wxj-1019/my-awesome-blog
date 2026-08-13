'use client';

/**
 * 初稿审阅组件：上半部分把初稿渲染为可滚动文档（whitespace-pre-wrap，最小高度），
 * 下半部分是「调整反馈」对话 + 输入；最底部是「确认初稿，进入编辑器」主按钮（success 色）。
 *
 * 流式进行中（AI 在调整初稿）时，累加正文实时显示在对话区作为 live preview。
 */
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Loader2, FileText, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WritingMessage } from '@/types/writing-session';

export interface DraftReviewProps {
  /** 初稿正文（Markdown）。 */
  draft: string;
  /** 调整反馈对话消息。 */
  messages: WritingMessage[];
  /** 是否正在流式（调整初稿中）。 */
  streaming: boolean;
  /** 流式期间累加的助手回复正文（live preview，显示在对话区）。 */
  streamContent?: string;
  /** 发送调整指令。 */
  onAdjust: (message: string) => void;
  /** 确认初稿，进入编辑器。 */
  onConfirm: () => void;
  /** 回退到大纲调整阶段（图循环回退边）。 */
  onRegress?: () => void;
}

export default function DraftReview({
  draft,
  messages,
  streaming,
  streamContent = '',
  onAdjust,
  onConfirm,
  onRegress,
}: DraftReviewProps) {
  const [input, setInput] = useState('');
  const convRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = convRef.current;
    if (!el) {return;}
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (atBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, streamContent, streaming]);

  const handleAdjust = () => {
    const trimmed = input.trim();
    if (!trimmed || streaming) {return;}
    onAdjust(trimmed);
    setInput('');
  };

  const renderMessages: WritingMessage[] = streaming && streamContent
    ? [...messages, {
        id: '__streaming__',
        role: 'assistant' as const,
        content: streamContent,
        created_at: new Date().toISOString(),
      }]
    : messages;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      {/* 初稿文档区（可滚动，最小高度） */}
      <div className="flex-1 min-h-[280px] overflow-y-auto rounded-2xl border border-border/50 bg-background/40 p-5">
        <div className="flex items-center gap-2 mb-3 text-xs text-foreground/50">
          <FileText className="w-3.5 h-3.5" />
          文章初稿
        </div>
        {draft.trim() ? (
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {draft}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-foreground/40 text-sm">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            初稿生成中…
          </div>
        )}
      </div>

      {/* 调整反馈对话区（紧凑） */}
      <div className="flex flex-col max-h-[240px] min-h-0 rounded-xl border border-border/40 bg-background/30">
        <div
          ref={convRef}
          aria-live="polite"
          aria-busy={streaming}
          className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2"
        >
          {messages.length === 0 && !streaming && (
            <p className="text-xs text-foreground/40 text-center py-2">
              想调整初稿？输入反馈，如「结尾再加一句号召」「第 2 段更简洁一些」…
            </p>
          )}
          {renderMessages.map(msg => (
            <div
              key={msg.id}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-lg px-3 py-1.5 text-xs',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background/60 border border-border/40 text-foreground'
                )}
              >
                {msg.role === 'assistant' && !msg.content && streaming && (
                  <span className="flex items-center gap-1.5 text-foreground/50">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    调整中…
                  </span>
                )}
                {msg.content && (
                  <div className="whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                    {msg.id === '__streaming__' && (
                      <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-primary/70 animate-pulse align-middle" />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 调整输入 */}
        <div className={cn('flex items-end gap-2 p-2 border-t border-border/30', streaming && 'opacity-60')}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAdjust();
              }
            }}
            placeholder="输入修改反馈…"
            rows={1}
            aria-label="初稿调整反馈输入"
            className="flex-1 px-3 py-2 rounded-lg bg-background/60 border border-border/40 text-foreground text-xs placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none disabled:cursor-not-allowed"
            disabled={streaming}
          />
          <button
            type="button"
            onClick={handleAdjust}
            disabled={!input.trim() || streaming}
            aria-label="继续调整初稿"
            className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 h-[36px] rounded-lg bg-foreground/10 text-foreground hover:bg-foreground/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium"
          >
            <Send className="w-3.5 h-3.5" />
            继续调整
          </button>
        </div>
      </div>

      {/* 确认初稿主按钮（success 色） */}
      <button
        type="button"
        onClick={onConfirm}
        disabled={streaming || !draft.trim()}
        aria-label="确认初稿，进入编辑器"
        className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-success text-success-foreground hover:bg-success/90 disabled:bg-success/40 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
      >
        <Send className="w-4 h-4" />
        确认初稿，进入编辑器
      </button>
      {/* 回退边：初稿不满意时回到大纲重拟 */}
      {onRegress && (
        <button
          type="button"
          onClick={onRegress}
          disabled={streaming}
          aria-label="返回大纲调整"
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-transparent text-muted-foreground hover:text-foreground hover:bg-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          初稿偏离方向？返回上一步（调整大纲）
        </button>
      )}
    </div>
  );
}
