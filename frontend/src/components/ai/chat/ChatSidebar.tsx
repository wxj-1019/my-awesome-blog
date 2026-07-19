'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { Search, Plus, Trash2, MessageSquare, Archive } from 'lucide-react';
import type { Conversation } from '@/types';
import EmptyState from '@/components/ui/EmptyState';


interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onArchiveConversation: (id: string) => void;
}

export default function ChatSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  onArchiveConversation,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('active');

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || conv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-80 bg-card dark:bg-card/90 backdrop-blur-xl border-r border-border dark:border-glass-border flex flex-col h-full shadow-lg dark:shadow-xl"
    >
      <div className="p-4 border-b border-border dark:border-glass-border bg-gradient-to-b from-card to-accent/20 dark:from-card dark:to-transparent">
        <button
          onClick={onCreateConversation}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg py-3 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">新建对话</span>
        </button>
      </div>

      <div className="p-4 border-b border-border dark:border-glass-border">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索对话..."
            className="w-full bg-secondary dark:bg-muted/20 text-foreground dark:text-foreground placeholder:text-muted-foreground rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'active', 'archived'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                filterStatus === status
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-secondary dark:bg-muted/30 text-muted-foreground dark:text-foreground/70 hover:bg-secondary/80 dark:hover:bg-muted/40'
              }`}
            >
              {status === 'all' ? '全部' : status === 'active' ? '进行中' : '已归档'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gradient-to-b from-accent/10 to-transparent dark:from-transparent dark:to-transparent">
        <AnimatePresence>
          {filteredConversations.map((conv, index) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              onClick={() => onSelectConversation(conv.id)}
              className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                currentConversationId === conv.id
                  ? 'bg-primary/10 border-primary/30 shadow-sm'
                  : 'bg-card dark:bg-muted/30 hover:bg-accent/50 dark:hover:bg-muted/40 border border-border dark:border-transparent hover:border-primary/20 dark:hover:border-muted/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground dark:text-foreground truncate mb-1">
                    {conv.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-muted-foreground/50">
                    <MessageSquare className="w-3 h-3" />
                    <span>{conv.total_messages} 条消息</span>
                    {conv.total_tokens > 0 && (
                      <>
                        <span className="text-muted-foreground/50 dark:text-muted-foreground/30">•</span>
                        <span>{conv.total_tokens} tokens</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchiveConversation(conv.id);
                    }}
                    className="p-1.5 rounded-lg bg-secondary dark:bg-muted/30 hover:bg-secondary/80 dark:hover:bg-muted/40 text-muted-foreground dark:text-foreground/70 hover:text-foreground dark:hover:text-foreground transition-all"
                    aria-label="归档对话"
                  >
                    <Archive className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    className="p-1.5 rounded-lg bg-error/10 dark:bg-red-500/20 hover:bg-error/20 dark:hover:bg-red-500/40 text-error dark:text-red-400 hover:text-error dark:hover:text-red-300 transition-all"
                    aria-label="删除对话"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {conv.status === 'archived' && (
                <div className="absolute top-2 right-2">
                  <Archive className="w-4 h-4 text-muted-foreground dark:text-muted-foreground/50" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredConversations.length === 0 && (
          <EmptyState
            size="sm"
            compact
            icon={MessageSquare}
            title="暂无对话"
            description="创建一个新对话开始聊天"
          />
        )}
      </div>
    </motion.div>
  );
}
