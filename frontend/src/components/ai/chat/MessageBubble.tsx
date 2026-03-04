'use client';

import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
import type { ConversationMessage } from '@/types';

interface MessageBubbleProps {
  message: ConversationMessage;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-primary' : 'bg-info'
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white dark:text-foreground" />
        )}
      </div>
      <div
        className={`flex-1 max-w-[70%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary text-white rounded-br-none'
            : 'bg-card dark:bg-card/90 border border-border dark:border-glass-border text-slate-800 dark:text-foreground rounded-bl-none shadow-md dark:shadow-lg'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium ${isUser ? 'text-white/80' : 'text-primary'}`}>
            {isUser ? '你' : 'AI 助手'}
          </span>
          {message.tokens && (
            <span className={`text-xs ${isUser ? 'text-white/60' : 'text-slate-500 dark:text-foreground/50'}`}>
              {message.tokens} tokens
            </span>
          )}
        </div>
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'text-white' : 'text-slate-700 dark:text-foreground'}`}>
          {message.content}
          {isStreaming && (
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="inline-block w-2 h-4 bg-current ml-1 align-middle"
            />
          )}
        </p>
      </div>
    </motion.div>
  );
}
