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
}

export default function AIWritingPanel({
  currentContent,
  onApply,
  defaultCollapsed = false,
}: AIWritingPanelProps) {
  const { error: toastError, success: toastSuccess } = useToast();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 新消息时滚到底
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleStop = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
    setIsStreaming(false);
    // 标记最后一条 assistant 消息为已完成
    setMessages(prev => prev.map((m, i) =>
      i === prev.length - 1 && m.role === 'assistant' ? { ...m, streaming: false } : m
    ));
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) {return;}

    const hasContent = currentContent.trim().length > 0;
    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    // 占位 assistant 消息，流式 chunk 逐步填入
    const assistantMsg: ChatMessage = { role: 'assistant', content: '', streaming: true };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsStreaming(true);

    const onChunk = (delta: string) => {
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === 'assistant') {
          next[next.length - 1] = { ...last, content: last.content + delta };
        }
        return next;
      });
    };
    const onTool = (info: { tool?: string }) => {
      const hint = info.tool === 'search_articles'
        ? '正在检索站内相关文章…'
        : info.tool === 'get_article_detail'
          ? '正在读取站内文章详情…'
          : info.tool ? `正在调用工具：${info.tool}` : '';
      if (hint) {
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === 'assistant') {
            next[next.length - 1] = { ...last, toolHint: hint };
          }
          return next;
        });
      }
    };
    const onComplete = () => {
      setIsStreaming(false);
      cancelRef.current = null;
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 && m.role === 'assistant' ? { ...m, streaming: false } : m
      ));
    };
    const onError = (msg: string) => {
      setIsStreaming(false);
      cancelRef.current = null;
      toastError(`AI 生成失败：${msg}`);
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === 'assistant' && !last.content) {
          // 失败且无内容：移除空占位
          next.pop();
        } else if (last) {
          next[next.length - 1] = { ...last, streaming: false };
        }
        return next;
      });
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
  }, [input, isStreaming, currentContent, toastError]);

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
          >
            <div className="p-4 space-y-3">
              {/* 对话区 */}
              {messages.length > 0 && (
                <div ref={scrollRef} className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
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

              {/* 输入区 */}
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={hasContent
                    ? '输入修改指令，如「加一段实际案例」「改成更口语化的风格」「总结一下结尾」…'
                    : '描述你想写的文章，如「如何用 Docker 部署 Next.js 应用，面向初学者，含完整命令」…'
                  }
                  rows={2}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-background/60 border border-border/50 text-foreground text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors resize-none"
                  disabled={isStreaming}
                />
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={handleStop}
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
