'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Mic, Settings } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled = false, placeholder = '输入消息...' }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card dark:bg-card/90 backdrop-blur-xl border border-border dark:border-glass-border rounded-xl p-4 shadow-lg dark:shadow-xl"
    >
      <div className="flex items-end gap-3">
        <button
          type="button"
          className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary dark:bg-muted/30 hover:bg-secondary/80 dark:hover:bg-muted/40 text-muted-foreground dark:text-foreground transition-colors flex items-center justify-center"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent text-foreground dark:text-foreground placeholder:text-muted-foreground resize-none outline-none text-sm leading-relaxed"
            style={{
              minHeight: '40px',
              maxHeight: '120px',
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary dark:bg-muted/30 hover:bg-secondary/80 dark:hover:bg-muted/40 text-muted-foreground dark:text-foreground transition-colors flex items-center justify-center"
        >
          <Settings className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary hover:bg-primary/90 text-white transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-border dark:border-glass-border"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground dark:text-muted-foreground/70 mb-1 block">Temperature</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                defaultValue="0.7"
                className="w-full accent-primary"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground dark:text-muted-foreground/70 mb-1 block">Max Tokens</label>
              <input
                type="range"
                min="100"
                max="4000"
                step="100"
                defaultValue="1000"
                className="w-full accent-primary"
              />
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
