'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, BookOpen, Keyboard, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickEmojiProps {
  onEmojiSelect: (emoji: string) => void;
}

// 常用表情列表
const EMOJIS = [
  '😀', '😂', '🥰', '😍', '🤔', '😎', '👍', '👎',
  '❤️', '🎉', '🔥', '✨', '💯', '🚀', '💪', '👏',
  '🙏', '🤝', '💪', '🌟', '✅', '❌', '⭐', '🌈'
];

interface QuickPhraseProps {
  onPhraseSelect: (phrase: string) => void;
}

// 常用短语列表
const PHRASES = [
  '谢谢分享！',
  '这个太棒了！',
  '学到了',
  '支持作者',
  '非常赞同',
  '期待更多',
  '加油！',
  '已收藏',
  '很有帮助',
  '继续努力'
];

interface KeyboardShortcutProps {
  isOpen: boolean;
  onClose: () => void;
}

// 快捷键说明
const SHORTCUTS = [
  { key: 'Ctrl + Enter', description: '发送留言' },
  { key: 'Ctrl + E', description: '打开表情面板' },
  { key: 'Ctrl + P', description: '打开常用短语' },
  { key: 'Esc', description: '关闭面板' }
];

export function QuickEmoji({ onEmojiSelect }: QuickEmojiProps) {
  return (
    <div className="grid grid-cols-6 gap-2 p-2">
      {EMOJIS.map((emoji, index) => (
        <motion.button
          key={emoji}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.02 }}
          onClick={() => onEmojiSelect(emoji)}
          className="text-2xl p-2 rounded-lg hover:bg-white/10 transition-colors"
          title={emoji}
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}

export function QuickPhrase({ onPhraseSelect }: QuickPhraseProps) {
  return (
    <div className="grid grid-cols-2 gap-2 p-2">
      {PHRASES.map((phrase, index) => (
        <motion.button
          key={phrase}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03 }}
          onClick={() => onPhraseSelect(phrase)}
          className="text-left px-3 py-2 text-sm text-white/80 rounded-lg hover:bg-white/10 transition-colors"
        >
          {phrase}
        </motion.button>
      ))}
    </div>
  );
}

export function KeyboardShortcutHelp({ isOpen, onClose }: KeyboardShortcutProps) {
  if (!isOpen) {return null;}

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-20 right-4 z-[10001] bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-xl min-w-[280px]"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-tech-cyan" />
            <span className="text-sm font-semibold text-white">快捷键</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
            aria-label="关闭"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between text-sm">
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs font-mono text-tech-cyan">
                {shortcut.key}
              </kbd>
              <span className="text-white/60">{shortcut.description}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

interface QuickActionsPanelProps {
  onEmojiSelect: (emoji: string) => void;
  onPhraseSelect: (phrase: string) => void;
}

type TabType = 'emoji' | 'phrase';

export function QuickActionsPanel({ onEmojiSelect, onPhraseSelect }: QuickActionsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('emoji');

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
      {/* Tab切换 */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('emoji')}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'emoji'
              ? 'text-tech-cyan bg-tech-cyan/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          )}
        >
          <Smile className="w-4 h-4 inline mr-2" />
          表情
        </button>
        <button
          onClick={() => setActiveTab('phrase')}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'phrase'
              ? 'text-tech-purple bg-tech-purple/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          )}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          常用语
        </button>
      </div>

      {/* 内容区域 */}
      <AnimatePresence mode="wait">
        {activeTab === 'emoji' && (
          <motion.div
            key="emoji"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <QuickEmoji onEmojiSelect={onEmojiSelect} />
          </motion.div>
        )}
        {activeTab === 'phrase' && (
          <motion.div
            key="phrase"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <QuickPhrase onPhraseSelect={onPhraseSelect} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
