'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Send,
  User,
  Bot,
  Sparkles,
  Loader2,
  AlertCircle,
  Plus,
  FileText,
  Check,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { env } from '@/lib/env';
import type { SelectedPromptInfo } from './ChatSidebar';

const API_BASE_URL = env.NEXT_PUBLIC_API_URL || 'http://localhost:8989/api/v1';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ChatWindowProps {
  onToggleSidebar: () => void;
  sessionMessages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  onNewSession: () => void;
  selectedPrompt?: SelectedPromptInfo | null;
}

export function ChatWindow({
  onToggleSidebar,
  sessionMessages,
  onMessagesChange,
  onNewSession,
  selectedPrompt,
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
    setError(null);
    setIsLoading(true);
    setStreamingContent('');

    try {
      const systemPrompt = selectedPrompt?.id
        ? `Using prompt "${selectedPrompt.name}": ${selectedPrompt.description || ''}`
        : '';

      const response = await fetch(`${API_BASE_URL}/llm/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...newMessages.map((m) => ({ role: m.role, content: m.content }))],
          stream: true,
          system_prompt: systemPrompt,
          prompt_id: selectedPrompt?.id,
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
      setError(err instanceof Error ? err.message : 'An error occurred');
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
    <div className="relative h-full">
      {/* Messages Area - Full height, content scrolls under header and input */}
      <div className="absolute inset-0 overflow-y-auto px-4 pt-20 pb-32 scrollbar-thin scrollbar-thumb-white/10">
        {sessionMessages.length === 0 && !streamingContent ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md space-y-6"
            >
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
                  <Bot size={32} className="text-white" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">开始对话</h2>
                <p className="mt-2 text-zinc-400">
                  {selectedPrompt
                    ? `当前使用「${selectedPrompt.name}」提示词`
                    : '选择一个提示词开始智能对话'}
                </p>
              </div>

              {selectedPrompt?.description && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 shrink-0">
                      <Sparkles size={16} className="text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{selectedPrompt.name}</div>
                      <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                        {selectedPrompt.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex flex-wrap justify-center gap-2">
                {['写一首诗', '解释概念', '翻译文本', '编写代码'].map((example) => (
                  <button
                    key={example}
                    onClick={() => setInput(example)}
                    className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                      <Bot size={16} className="text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3',
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                        : 'bg-white/5 text-zinc-200 border border-white/10'
                    )}
                  >
                    <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-700">
                      <User size={16} className="text-zinc-300" />
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white/5 text-zinc-200 border border-white/10">
                  <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {streamingContent}
                    <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse" />
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
                  <Loader2 className="animate-spin text-cyan-400" size={16} />
                  <span className="text-sm text-zinc-400">正在思考...</span>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
              >
                <AlertCircle className="text-red-400 shrink-0" size={20} />
                <div className="flex-1">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <RefreshCw size={14} />
                  重试
                </button>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Header - Fixed overlay with blur */}
      <div className="absolute top-0 left-0 right-0 z-20 flex h-16 items-center justify-between border-b border-white/10 px-4 bg-black/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="打开侧边栏"
          >
            <Menu size={20} aria-hidden="true" />
          </button>

          {selectedPrompt ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles size={14} className="text-cyan-400" />
              </motion.div>
              <span className="text-sm font-medium text-cyan-300">{selectedPrompt.name}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </motion.div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <FileText size={14} />
              <span>未选择提示词</span>
            </div>
          )}
        </div>

        <button
          onClick={onNewSession}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">新对话</span>
        </button>
      </div>

      {/* Input Area - Fixed overlay with blur */}
      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 p-4 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl">
          {selectedPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 flex items-center justify-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 text-xs text-cyan-400">
                <Sparkles size={12} />
                <span>使用提示词: {selectedPrompt.name}</span>
                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-cyan-500/20">
                  <Check size={10} className="text-cyan-400" />
                </div>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedPrompt ? `使用「${selectedPrompt.name}」进行对话...` : '输入消息...'}
              rows={1}
              disabled={isLoading}
              className={cn(
                'w-full resize-none rounded-2xl px-4 py-3 pr-12 text-white placeholder-zinc-500',
                'bg-white/5 border border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20',
                'transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                'min-h-[48px] max-h-[200px]'
              )}
              style={{
                height: 'auto',
                overflow: input.split('\n').length > 3 || input.length > 200 ? 'auto' : 'hidden',
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2',
                'flex h-9 w-9 items-center justify-center rounded-xl',
                'transition-all duration-200',
                input.trim() && !isLoading
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50'
                  : 'bg-white/10 text-zinc-500 cursor-not-allowed'
              )}
              aria-label="发送"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
            </button>
          </form>
          <p className="mt-2 text-center text-xs text-zinc-600">
            按 Enter 发送 · Shift + Enter 换行
          </p>
        </div>
      </div>
    </div>
  );
}
