'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import {
  Menu,
  Send,
  User,
  Bot,
  Sparkles,
  Loader2,
  AlertCircle,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE_URL, TOKEN_KEY, USER_KEY } from '@/lib/api-client';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

/** 默认系统提示：写作助手定位（站内文章撰写、润色、校对） */
const WRITING_ASSISTANT_PROMPT =
  '你是这个个人博客的写作助手，主要帮助用户撰写、润色、校对中文文章与站内各类内容。' +
  '输出使用适合直接发布的 Markdown 格式，语言自然流畅，避免模板化表达。';

interface ChatWindowProps {
  onToggleSidebar: () => void;
  sessionMessages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  onNewSession: () => void;
}

export function ChatWindow({
  onToggleSidebar,
  sessionMessages,
  onMessagesChange,
  onNewSession,
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [streamingContent, setStreamingContent] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionMessages, streamingContent]);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) {return;}

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...sessionMessages, userMessage];
    onMessagesChange(newMessages);
    setInput('');
    // 清空后把输入框高度复位，避免下次输入沿用上次撑开的高度
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    setError(null);
    setIsLoading(true);
    setStreamingContent('');

    try {
      // 固定走写作助手系统提示（定位：站内文章撰写与内容打磨）
      const systemPrompt = WRITING_ASSISTANT_PROMPT;

      // 流式请求需裸 fetch，手动带 JWT（与 apiRequest 的认证逻辑一致）
      const token =
        typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

      const response = await fetch(`${API_BASE_URL}/llm/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          messages: [...newMessages.map((m) => ({ role: m.role, content: m.content }))],
          stream: true,
          system_prompt: systemPrompt,
        }),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {break;}

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {continue;}

              try {
                const parsed = JSON.parse(data);

                if (parsed.error) {
                  throw new Error(parsed.message || 'Stream error');
                }

                if (parsed.content) {
                  assistantContent += parsed.content;
                  setStreamingContent(assistantContent);
                }
              } catch (parseError) {
                if (parseError instanceof SyntaxError) {
                  continue;
                }
                throw parseError;
              }
            }
          }
        }
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent || 'No response generated.',
        timestamp: Date.now(),
      };

      onMessagesChange([...newMessages, assistantMessage]);
      setStreamingContent('');
    } catch (err) {
      console.error('Chat error:', err);
      const msg = err instanceof Error ? err.message : 'An error occurred';
      // 401：token 失效，清凭据并跳登录（与 apiRequest 的处理一致）
      if (msg.includes('401') && typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = '/login';
        return;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleRetry = () => {
    if (sessionMessages.length > 0) {
      const lastUserMessage = [...sessionMessages].reverse().find((m) => m.role === 'user');
      if (lastUserMessage) {
        const messagesWithoutLast = sessionMessages.slice(0, -1);
        onMessagesChange(messagesWithoutLast);
        setInput(lastUserMessage.content);
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header - 顶部固定栏（token 化 + 降 blur） */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-glass-border bg-glass/40 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-muted-foreground hover:bg-glass hover:text-foreground"
            aria-label="打开侧边栏"
          >
            <Menu size={20} aria-hidden />
          </button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText size={14} aria-hidden />
            <span>写作助手模式</span>
          </div>
        </div>

        {/* 「新对话」入口移除：侧边栏已有，避免重复 */}
        <button
          onClick={onNewSession}
          className="rounded-lg p-2 text-muted-foreground hover:bg-glass hover:text-foreground md:hidden"
          aria-label="新对话"
        >
          <Sparkles size={18} aria-hidden />
        </button>
      </div>

      {/* Messages Area - flex-1 占满中间 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {sessionMessages.length === 0 && !streamingContent ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md space-y-6"
            >
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Bot size={32} aria-hidden />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground">写作助手</h2>
                <p className="mt-2 text-muted-foreground">
                  辅助你撰写站内文章、润色草稿、打磨各类内容
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {['润色这段文字', '为草稿拟 5 个标题', '把大纲扩写成初稿', '检查语病与错别字'].map((example) => (
                  <button
                    key={example}
                    onClick={() => setInput(example)}
                    className="rounded-full bg-glass px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 pb-8">
            <AnimatePresence initial={false}>
              {sessionMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    'flex gap-4',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Bot size={16} aria-hidden />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-glass-border bg-glass text-foreground'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <div className="text-sm leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_code]:rounded [&_code]:bg-muted/40 [&_code]:px-1 [&_code]:py-0.5 [&_a]:text-primary [&_a]:underline">
                        <MarkdownRenderer content={message.content} />
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {message.content}
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-glass text-muted-foreground">
                      <User size={16} aria-hidden />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {streamingContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Bot size={16} aria-hidden />
                </div>
                <div className="max-w-[80%] rounded-2xl border border-glass-border bg-glass px-4 py-3 text-foreground">
                  <div className="text-sm leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_code]:rounded [&_code]:bg-muted/40 [&_code]:px-1 [&_code]:py-0.5 [&_a]:text-primary [&_a]:underline">
                    <MarkdownRenderer content={streamingContent} />
                    <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-primary align-middle" aria-hidden />
                  </div>
                </div>
              </motion.div>
            )}

            {isLoading && !streamingContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Bot size={16} aria-hidden />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-glass-border bg-glass px-4 py-3">
                  <Loader2 className="animate-spin text-primary" size={16} aria-hidden />
                  <span className="text-sm text-muted-foreground">正在思考...</span>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4"
              >
                <AlertCircle className="shrink-0 text-red-400" size={20} aria-hidden />
                <div className="flex-1">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/20"
                >
                  <RefreshCw size={14} aria-hidden />
                  重试
                </button>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - 底部固定（token 化 + 降 blur） */}
      <div className="shrink-0 border-t border-glass-border bg-glass/40 p-4 backdrop-blur-md">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // 自适应增高：随内容撑高，封顶 200px，超出后内部滚动
                const el = e.target;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="输入想写或想润色的内容..."
              rows={1}
              disabled={isLoading}
              className={cn(
                'w-full resize-none overflow-y-auto rounded-2xl px-4 py-3 pr-12',
                'placeholder:text-muted-foreground/70',
                'border border-glass-border bg-glass text-foreground',
                'focus:border-primary/50 focus:ring-1 focus:ring-primary/20',
                'transition-[border-color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50',
                'min-h-[48px] max-h-[200px]'
              )}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2',
                'flex h-9 w-9 items-center justify-center rounded-xl',
                'transition-[colors,transform] duration-200',
                input.trim() && !isLoading
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50'
                  : 'cursor-not-allowed bg-muted text-muted-foreground'
              )}
              aria-label="发送"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} aria-hidden />
              ) : (
                <Send size={18} aria-hidden />
              )}
            </button>
          </form>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            按 Enter 发送 · Shift + Enter 换行
          </p>
        </div>
      </div>
    </div>
  );
}
