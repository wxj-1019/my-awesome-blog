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
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        className={cn(
          "fixed top-16 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-black/80 backdrop-blur-xl transition-transform duration-300 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
          <div className="flex items-center gap-2 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <Cpu size={18} className="text-white" />
            </div>
            <span className="font-bold tracking-wide">AI Chat</span>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="关闭"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) {onClose();}
            }}
            className="group flex w-full items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-gradient-to-r hover:from-cyan-600 hover:to-blue-600 hover:shadow-lg hover:shadow-cyan-500/20 border border-white/10 hover:border-transparent"
          >
            <Plus size={18} className="text-cyan-400 group-hover:text-white transition-colors" />
            <span>新对话</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-none">
          <div className="mb-2 px-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
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
                  "group relative flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-all",
                  currentSessionId === session.id
                    ? "bg-white/10 text-white shadow-md"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <MessageSquare size={16} className={cn(
                  "shrink-0 transition-colors",
                  currentSessionId === session.id ? "text-cyan-400" : "text-zinc-600 group-hover:text-zinc-400"
                )} />
                <div className="flex-1 truncate">
                  <div className="truncate font-medium">{session.title}</div>
                  {session.preview && (
                    <div className="truncate text-xs text-zinc-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {session.preview}
                    </div>
                  )}
                </div>
                
                {/* Delete Button (Visible on Hover/Active) */}
                <div 
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity",
                    "group-hover:opacity-100"
                  )}
                >
                  <div
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id, e);
                    }}
                    className="rounded p-1.5 hover:bg-red-500/20 hover:text-red-400 text-zinc-500"
                    aria-label="删除会话"
                  >
                    <Trash2 size={14} aria-hidden="true" />
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
        <div className="border-t border-white/5 p-4">
          <button
            onClick={() => setIsPromptSettingsOpen(true)}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl p-3 transition-all group relative overflow-hidden",
              selectedPrompt 
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30" 
                : "bg-white/5 hover:bg-white/10"
            )}
          >
            {/* Animated glow effect when prompt is selected */}
            {selectedPrompt && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-600/10"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
            
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
              selectedPrompt 
                ? "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30" 
                : "bg-gradient-to-br from-cyan-500/50 to-blue-600/50"
            )}>
              {selectedPrompt ? (
                <Sparkles size={18} className="text-white" />
              ) : (
                <FileText size={18} className="text-white" />
              )}
            </div>
            
            <div className="flex-1 overflow-hidden text-left relative z-10">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "truncate text-sm font-medium transition-colors",
                  selectedPrompt ? "text-cyan-300" : "text-white"
                )}>
                  {selectedPrompt?.name || '提示词设置'}
                </span>
                {selectedPrompt && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500"
                  >
                    <Check size={12} className="text-white" />
                  </motion.div>
                )}
              </div>
              <div className={cn(
                "truncate text-xs transition-colors",
                selectedPrompt ? "text-cyan-400/70" : "text-zinc-500"
              )}>
                {selectedPrompt ? selectedPrompt.description?.slice(0, 30) || '点击更换提示词' : '点击选择提示词'}
              </div>
            </div>

            {/* Arrow indicator */}
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-zinc-500"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
          </button>

          {/* Category badge when selected */}
          {selectedPrompt?.category && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex justify-center"
            >
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                {selectedPrompt.category}
              </span>
            </motion.div>
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
