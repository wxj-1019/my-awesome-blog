'use client';

/**
 * AI 写作面板：嵌入「写文章」编辑器顶部。
 *
 * 流程：输入主题 → 流式生成（打字机）→ 一键「填入编辑器」/「追加到文末」。
 * 已有正文时也可继续输入指令做对话式改稿（content 来自父组件当前正文）。
 *
 * 设计要点：
 * - 每条 AI 回复下方挂「填入 / 追加」按钮，由父组件通过 onApply 落到编辑器
 * - 流式进行中显示「停止」按钮，调用 cancel 句柄中止 fetch
 * - 工具调用（站内检索）单独显示一行提示，让用户知道 AI 在查站内文
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import {
  Sparkles,
  Send,
  Square,
  FileInput,
  PlusCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api-client';
import { useToast } from '@/components/admin/Toast';
import { cn } from '@/lib/utils';

/** 一条对话消息 */
interface ChatMessage {
  /** 稳定唯一 id，作 React key（禁止用 index） */
  id: number;
  role: 'user' | 'assistant';
  content: string;
  /** 流式生成中标记（未完成时按钮不显示） */
  streaming?: boolean;
  /** 工具调用提示（仅 assistant，检索站内文时显示） */
  toolHint?: string;
}

export interface AIWritingPanelProps {
  /** 当前编辑器正文；非空时把请求当作「改稿」，否则当作「生成」 */
  currentContent: string;
  /** 应用 AI 产出到编辑器。mode: replace=覆盖全文, append=追加到文末 */
  onApply: (text: string, mode: 'replace' | 'append') => void;
  /** 默认折叠态（编辑现有文章时可默认折叠） */
  defaultCollapsed?: boolean;
  /**
   * 外部繁忙态（如编辑器侧的「AI 润色」正在流式替换全文）。
   * 为 true 时整个面板禁用输入与发送，避免两条流并发污染 content。
   */
  busy?: boolean;
}

export default function AIWritingPanel({
  currentContent,
  onApply,
  defaultCollapsed = false,
  busy = false,
}: AIWritingPanelProps) {
  const { error: toastError, success: toastSuccess } = useToast();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // 同步并发守卫：setState 是异步的，靠 ref 才能堵住「连点」的 stale 窗口
  const streamingRef = useRef(false);
  // 自增消息 id，保证 key 稳定（禁用 index 作 key）
  const msgIdRef = useRef(0);
  // 当前流的 assistant 消息 id，避免更新到上一轮残留消息
  const activeAssistantIdRef = useRef<number>(-1);
  // 用户是否在滚动区底部（用于流式时只在该case自动跟随）
  const atBottomRef = useRef(true);

  const trackScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {return;}
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  }, []);

  // 滚动跟随：仅在追加新消息或流式（且用户已在底部）时触发，避免抢占用户滚动
  const scrollToBottom = useCallback((force = false) => {
    const el = scrollRef.current;
    if (!el) {return;}
    if (force || atBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  const handleStop = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
    streamingRef.current = false;
    setIsStreaming(false);
    const aid = activeAssistantIdRef.current;
    if (aid !== -1) {
      setMessages(prev => prev.map(m => m.id === aid ? { ...m, streaming: false } : m));
    }
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    // ref 守卫堵住 stale-closure 窗口（比 isStreaming state 更可靠）
    if (!trimmed || streamingRef.current || busy) {return;}
    streamingRef.current = true;

    const hasContent = currentContent.trim().length > 0;
    const userMsg: ChatMessage = { id: ++msgIdRef.current, role: 'user', content: trimmed };
    // 占位 assistant 消息，流式 chunk 逐步填入
    const assistantId = ++msgIdRef.current;
    activeAssistantIdRef.current = assistantId;
    const assistantMsg: ChatMessage = { id: assistantId, role: 'assistant', content: '', streaming: true };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsStreaming(true);
    scrollToBottom(true);

    // 节流：把高频 chunk 攒到 rAF 里一次性 flush，避免每 token 全量重渲染
    let pendingDelta = '';
    let rafScheduled = false;
    const flush = () => {
      rafScheduled = false;
      if (!pendingDelta) {return;}
      const delta = pendingDelta;
      pendingDelta = '';
      const aid = assistantId;
      setMessages(prev => prev.map(m =>
        m.id === aid && m.role === 'assistant' ? { ...m, content: m.content + delta } : m
      ));
      scrollToBottom();
    };

    const onChunk = (delta: string) => {
      pendingDelta += delta;
      if (!rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(flush);
      }
    };
    const onTool = (info: { tool?: string }) => {
      const hint = info.tool === 'search_articles'
        ? '正在检索站内相关文章…'
        : info.tool === 'get_article_detail'
          ? '正在读取站内文章详情…'
          : info.tool ? `正在调用工具：${info.tool}` : '';
      if (hint) {
        const aid = assistantId;
        setMessages(prev => prev.map(m =>
          m.id === aid && m.role === 'assistant' ? { ...m, toolHint: hint } : m
        ));
      }
    };
    const finishStream = () => {
      // flush 残留 chunk，避免最后一个 rAF 被取消导致末尾丢字
      if (rafScheduled) {
        cancelAnimationFrame(requestAnimationFrame(() => {}));
        // 直接同步 flush 一次
        if (pendingDelta) {
          const delta = pendingDelta;
          pendingDelta = '';
          const aid = assistantId;
          setMessages(prev => prev.map(m =>
            m.id === aid && m.role === 'assistant' ? { ...m, content: m.content + delta } : m
          ));
        }
      }
      streamingRef.current = false;
      setIsStreaming(false);
      cancelRef.current = null;
    };
    const onComplete = () => {
      const aid = assistantId;
      setMessages(prev => prev.map(m =>
        m.id === aid && m.role === 'assistant' ? { ...m, streaming: false } : m
      ));
      finishStream();
    };
    const onError = (msg: string) => {
      toastError(`AI 生成失败：${msg}`);
      const aid = assistantId;
      setMessages(prev => {
        const target = prev.find(m => m.id === aid && m.role === 'assistant');
        if (target && !target.content) {
          // 失败且无内容：移除空占位
          return prev.filter(m => m.id !== aid);
        }
        return prev.map(m => m.id === aid ? { ...m, streaming: false } : m);
      });
      finishStream();
    };

    if (hasContent) {
      // 改稿：把当前正文 + 指令一起送
      cancelRef.current = adminApi.agent.reviseStream(
        { content: currentContent, instruction: trimmed },
        { onChunk, onComplete, onError }
      );
    } else {
      // 生成：按主题流式产出
      cancelRef.current = adminApi.agent.generateStream(
        { topic: trimmed, context_mode: 'auto' },
        { onTool, onChunk, onComplete, onError }
      );
    }
  }, [input, busy, currentContent, toastError, scrollToBottom]);

  const handleApply = useCallback((text: string, mode: 'replace' | 'append') => {
    if (!text.trim()) {
      toastError('AI 还没有输出内容');
      return;
    }
    onApply(text, mode);
    toastSuccess(mode === 'replace' ? '已填入编辑器' : '已追加到文末');
  }, [onApply, toastError, toastSuccess]);

  // 卸载时中止进行中的流
  useEffect(() => () => cancelRef.current?.(), []);

  const hasContent = currentContent.trim().length > 0;

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] overflow-hidden">
      {/* 折叠头 */}
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-primary/5 transition-colors"
        aria-expanded={!collapsed}
        aria-controls="ai-writing-panel-body"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/15">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
              AI 写作助手
              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {hasContent ? '改稿模式' : '生成模式'}
              </span>
            </div>
            <div className="text-xs text-foreground/50">
              {hasContent ? '基于当前正文，输入指令让 AI 修改' : '告诉 AI 你想写什么，自动生成初稿'}
            </div>
          </div>
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4 text-foreground/40" /> : <ChevronUp className="w-4 h-4 text-foreground/40" />}
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-primary/10"
            id="ai-writing-panel-body"
          >
            <div className="p-4 space-y-3">
              {/* 对话区：aria-live 让屏幕阅读器感知 AI 输出，aria-busy 标记流式进行中 */}
              {messages.length > 0 && (
                <div
                  ref={scrollRef}
                  onScroll={trackScroll}
                  aria-live="polite"
                  aria-busy={isStreaming}
                  className="space-y-3 max-h-[360px] overflow-y-auto pr-1"
                >
                  {messages.map(msg => (
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
                        {msg.role === 'assistant' && msg.toolHint && (
                          <div className="flex items-center gap-1.5 text-xs text-primary mb-1.5 pb-1.5 border-b border-border/30">
                            <Search className="w-3 h-3 animate-pulse" />
                            {msg.toolHint}
                          </div>
                        )}
                        {msg.role === 'assistant' && !msg.content && msg.streaming && !msg.toolHint && (
                          <div className="flex items-center gap-1.5 text-foreground/50">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            思考中…
                          </div>
                        )}
                        {msg.content && (
                          <div className="whitespace-pre-wrap break-words leading-relaxed">
                            {msg.content}
                            {msg.streaming && <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary/70 animate-pulse align-middle" />}
                          </div>
                        )}
                        {/* AI 回复完成且非空：显示应用按钮 */}
                        {msg.role === 'assistant' && !msg.streaming && msg.content.trim() && (
                          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/30">
                            <button
                              type="button"
                              onClick={() => handleApply(msg.content, 'replace')}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              <FileInput className="w-3 h-3" />
                              填入编辑器
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApply(msg.content, 'append')}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-foreground/5 text-foreground/70 hover:bg-foreground/10 transition-colors"
                            >
                              <PlusCircle className="w-3 h-3" />
                              追加到文末
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 输入区：isStreaming 或外部 busy（润色中）时禁用，避免并发污染 content */}
              <div className={cn('flex items-end gap-2 transition-opacity', (isStreaming || busy) && 'opacity-60')}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={busy
                    ? '编辑器正在执行 AI 操作，请稍候…'
                    : hasContent
                      ? '输入修改指令，如「加一段实际案例」「改成更口语化的风格」「总结一下结尾」…'
                      : '描述你想写的文章，如「如何用 Docker 部署 Next.js 应用，面向初学者，含完整命令」…'
                  }
                  rows={2}
                  aria-label="AI 写作指令输入"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-background/60 border border-border/50 text-foreground text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors resize-none disabled:cursor-not-allowed"
                  disabled={isStreaming || busy}
                />
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    aria-label="停止 AI 生成"
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 h-[42px] rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    停止
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() || busy}
                    aria-label="发送给 AI"
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 h-[42px] rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    发送
                  </button>
                )}
              </div>
              <p className="text-[11px] text-foreground/40">
                Enter 发送 · Shift+Enter 换行 · 生成模式下 AI 会先检索站内文章保持风格一致
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
