'use client';

/**
 * 澄清阶段对话组件：展示持久化消息、流式光标、输入框、停止按钮，
 * 以及满足条件后出现的「生成大纲」按钮。
 *
 * 与既有 AIWritingPanel 的视觉语言一致（用户气泡右对齐 primary，助手气泡左对齐背景），
 * 但消息来自服务端持久化（session.messages），而非本地态。
 * 流式进行中由父组件通过 streamingProps 把累加的 streamContent 当成最后一条助手消息实时显示。
 */
import { useEffect, useRef, useState } from 'react';
import { Send, Square, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WritingMessage } from '@/types/writing-session';

/** 澄清冷启动模板：点击填入输入框（可修改后再发送） */
const TEMPLATES = [
  '写一篇技术教程',
  '写一篇产品评测',
  '写一篇生活随笔',
  '写一篇读书笔记',
];

export interface ClarificationChatProps {
  /** 持久化的对话消息（来自会话）。 */
  messages: WritingMessage[];
  /** 是否正在流式接收助手回复。 */
  streaming: boolean;
  /** 是否已满足生成大纲条件（meta.ready_for_outline）。 */
  readyForOutline: boolean;
  /** 流式期间累加的助手回复正文（live preview）。 */
  streamContent?: string;
  /** 发送用户消息。 */
  onSend: (message: string) => void;
  /** 生成大纲（进入大纲审阅阶段）。 */
  onGenerateOutline: () => void;
  /** 中止当前流式生成（由父组件 cancelRef 触发）。 */
  onStop?: () => void;
}

export default function ClarificationChat({
  messages,
  streaming,
  readyForOutline,
  streamContent = '',
  onSend,
  onGenerateOutline,
  onStop,
}: ClarificationChatProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 流式 / 新消息时跟随到底（保留用户主动上滑的能力：仅在距底部 < 80px 时跟随）
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {return;}
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (atBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, streamContent, streaming]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || streaming) {return;}
    onSend(trimmed);
    setInput('');
  };

  // 流式中：把累加正文当作最后一条助手消息渲染（live preview）
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
      {/* 对话区 */}
      <div
        ref={scrollRef}
        aria-live="polite"
        aria-busy={streaming}
        className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1"
      >
        {messages.length === 0 && !streaming && (
          <div className="h-full flex flex-col items-center justify-center text-center text-foreground/50 gap-3 py-8">
            <div className="p-2.5 rounded-full bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm">和 AI 聊聊你想写什么</p>
            <p className="text-xs text-foreground/40 max-w-sm">
              描述主题、受众、风格、篇幅…AI 会先帮你理清需求。也可以直接描述你的想法，AI 会逐步确认
            </p>
            {/* 模板快捷填充：点击填入输入框（可修改后再发送），降低冷启动成本 */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-sm">
              {TEMPLATES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setInput(t)}
                  className="px-2.5 py-1 rounded-full border border-border/50 text-[11px] text-foreground/60 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
        {renderMessages.map(msg => (
          <div
            key={msg.id}
            className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background/60 border border-border/40 text-foreground'
              )}
            >
              {msg.role === 'assistant' && !msg.content && streaming && (
                <div className="flex items-center gap-1.5 text-foreground/50">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  思考中…
                </div>
              )}
              {msg.content && (
                <div className="whitespace-pre-wrap break-words leading-relaxed">
                  {msg.content}
                  {msg.id === '__streaming__' && (
                    <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary/70 animate-pulse align-middle" />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 输入区 */}
      <div className={cn('flex items-end gap-2 transition-opacity', streaming && 'opacity-60')}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="描述你想写的文章，如「如何用 Docker 部署 Next.js，面向初学者，含完整命令」…"
          rows={2}
          aria-label="澄清需求输入"
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-background/60 border border-border/50 text-foreground text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors resize-none disabled:cursor-not-allowed"
          disabled={streaming}
        />
        {streaming ? (
          <button
            type="button"
            onClick={() => onStop?.()}
            aria-label="停止生成"
            className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 h-[42px] rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            停止
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label="发送消息"
            className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 h-[42px] rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            发送
          </button>
        )}
      </div>
      <p className="text-[11px] text-foreground/40">
        Enter 发送 · Shift+Enter 换行
      </p>

      {/* 满足条件后出现：生成大纲 */}
      {readyForOutline && !streaming && (
        <button
          type="button"
          onClick={onGenerateOutline}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-semibold"
        >
          <Sparkles className="w-4 h-4" />
          生成大纲
        </button>
      )}
    </div>
  );
}
