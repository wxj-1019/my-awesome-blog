'use client';

import { motion, AnimatePresence } from '@/lib/framer-motion';
import { MessageSquare, Plus, Trash2, FileText, X, Cpu, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { Prompt } from '@/types';
import PromptSettings from './PromptSettings';
import EmptyState from '@/components/ui/EmptyState';

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
  preview?: string;
}

export interface SelectedPromptInfo {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt?: (prompt: Prompt) => void;
  selectedPrompt?: SelectedPromptInfo | null;
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  onClose,
  onSelectPrompt,
  selectedPrompt,
}: ChatSidebarProps) {
  const [isPromptSettingsOpen, setIsPromptSettingsOpen] = useState(false);

  const handleSelectPrompt = (prompt: Prompt) => {
    onSelectPrompt?.(prompt);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        className={cn(
          'fixed top-16 bottom-0 left-0 z-50 flex w-72 flex-col',
          'border-r border-glass-border bg-glass/60 backdrop-blur-md',
          'transition-transform duration-300 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-glass-border px-4">
          <div className="flex items-center gap-2 text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Cpu size={18} aria-hidden />
            </div>
            <span className="font-bold tracking-wide">AI Chat</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-glass hover:text-foreground md:hidden"
            aria-label="关闭"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="shrink-0 p-4">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) {onClose();}
            }}
            className={cn(
              'group flex w-full items-center gap-3 rounded-xl px-4 py-3',
              'text-sm font-medium text-foreground',
              'border border-glass-border bg-glass',
              'transition-colors hover:border-primary/40 hover:text-primary'
            )}
          >
            <Plus size={18} className="text-primary" />
            <span>新对话</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            History
          </div>
          <div className="space-y-1">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 768) {onClose();}
                }}
                className={cn(
                  'group relative flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm',
                  'transition-colors',
                  currentSessionId === session.id
                    ? 'bg-primary/10 text-foreground'
                    : 'text-muted-foreground hover:bg-glass hover:text-foreground'
                )}
              >
                <MessageSquare
                  size={16}
                  className={cn(
                    'shrink-0',
                    currentSessionId === session.id ? 'text-primary' : 'text-muted-foreground'
                  )}
                  aria-hidden
                />
                <div className="flex-1 truncate">
                  <div className="truncate font-medium">{session.title}</div>
                  {session.preview && (
                    <div className="mt-0.5 truncate text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {session.preview}
                    </div>
                  )}
                </div>

                {/* Delete Button (Visible on Hover) */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id, e);
                    }}
                    className="rounded p-1.5 text-muted-foreground hover:bg-red-500/20 hover:text-red-400"
                    aria-label="删除会话"
                  >
                    <Trash2 size={14} aria-hidden />
                  </div>
                </div>
              </button>
            ))}

            {sessions.length === 0 && (
              <EmptyState
                size="sm"
                compact
                icon={MessageSquare}
                title="暂无历史记录"
                description="开始一段新对话吧"
                className="px-2"
              />
            )}
          </div>
        </div>

        {/* Footer - 提示词设置入口 */}
        <div className="shrink-0 border-t border-glass-border p-4">
          <button
            onClick={() => setIsPromptSettingsOpen(true)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl p-3 transition-colors',
              selectedPrompt
                ? 'border border-primary/30 bg-primary/10'
                : 'border border-glass-border bg-glass hover:border-primary/40'
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                selectedPrompt ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'
              )}
            >
              {selectedPrompt ? <Sparkles size={18} aria-hidden /> : <FileText size={18} aria-hidden />}
            </div>

            <div className="flex-1 overflow-hidden text-left">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'truncate text-sm font-medium',
                    selectedPrompt ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {selectedPrompt?.name || '提示词设置'}
                </span>
                {selectedPrompt && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check size={12} className="text-primary-foreground" aria-hidden />
                  </span>
                )}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {selectedPrompt
                  ? selectedPrompt.description?.slice(0, 30) || '点击更换提示词'
                  : '点击选择提示词'}
              </div>
            </div>
          </button>

          {/* Category badge when selected */}
          {selectedPrompt?.category && (
            <div className="mt-2 flex justify-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                {selectedPrompt.category}
              </span>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Prompt Settings Panel */}
      <PromptSettings
        isOpen={isPromptSettingsOpen}
        onClose={() => setIsPromptSettingsOpen(false)}
        onSelectPrompt={handleSelectPrompt}
        selectedPromptId={selectedPrompt?.id}
      />
    </>
  );
}
