'use client';

import { useState, useRef, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { createMessage, DANMAKU_COLORS, validateMessage } from '@/services/messageService';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import { Send, Palette, MessageSquare, Sparkles, Smile, Bold, Italic, Link, AtSign } from 'lucide-react';
import { Message } from '@/types';

interface MessageInputProps {
  isLoggedIn: boolean;
  currentUser?: { id: string; username: string; avatar?: string } | null;
  onMessageSent: (message: Message) => void;
}

function MessageInput({
  isLoggedIn,
  currentUser,
  onMessageSent
}: MessageInputProps) {
  const { themedClasses } = useThemedClasses();
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(DANMAKU_COLORS[0].value);
  const [isDanmaku, setIsDanmaku] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证内容
    const validation = validateMessage(content);
    if (!validation.isValid) {
      setError(validation.error || null);
      return;
    }

    setIsSubmitting(true);
    try {
      const newMessage = await createMessage({
        content: content.trim(),
        color: selectedColor,
        isDanmaku,
      });

      onMessageSent(newMessage);
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [content, selectedColor, isDanmaku, onMessageSent]);

  // 自动调整文本框高度
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, []);

  // 插入表情符号
  const insertEmoji = useCallback((emoji: string) => {
    if (textareaRef.current) {
      const startPos = textareaRef.current.selectionStart;
      const endPos = textareaRef.current.selectionEnd;
      const newText = content.substring(0, startPos) + emoji + content.substring(endPos);
      setContent(newText);
      setShowEmojiPicker(false);

      // 延迟调整高度
      setTimeout(adjustTextareaHeight, 0);
    }
  }, [content, adjustTextareaHeight]);

  if (!isLoggedIn) {
    return (
      <div className={cn(
        "p-6 rounded-xl text-center",
        themedClasses.cardBgClass
      )}>
        <MessageSquare className="w-10 h-10 mx-auto mb-3 text-tech-cyan/50" />
        <p className={cn("mb-2", themedClasses.textClass)}>
          登录后即可发表留言
        </p>
        <a
          href="/login"
          className="text-sm text-tech-cyan hover:text-tech-lightcyan hover:underline"
        >
          点击登录 →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn(
      "p-4 rounded-xl",
      themedClasses.cardBgClass
    )}>
      {/* 用户信息 */}
      <div className="flex items-center gap-3 mb-4">
        {currentUser?.avatar ? (
          <img
            src={currentUser.avatar}
            alt={currentUser.username}
            className="w-8 h-8 rounded-full border border-tech-cyan/30"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-tech-cyan to-tech-lightcyan flex items-center justify-center text-white text-sm font-bold">
            {currentUser?.username.charAt(0).toUpperCase()}
          </div>
        )}
        <span className={cn("text-sm font-medium", themedClasses.textClass)}>
          {currentUser?.username}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-500 border border-purple-500/30">
          Lv.5
        </span>
      </div>

      {/* 输入框 */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setError(null);
            adjustTextareaHeight();
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!isSubmitting && content.trim().length > 0) {
                handleSubmit(e as unknown as React.FormEvent);
              }
            }
          }}
          placeholder="写下你的留言... (按 Enter 发送，Shift+Enter 换行)"
          maxLength={200}
          rows={3}
          className={cn(
            "w-full px-4 py-3 rounded-lg resize-none",
            "bg-background/50 border border-input",
            "focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 focus:border-tech-cyan",
            "placeholder:text-muted-foreground",
            "transition-all duration-200",
            themedClasses.textClass
          )}
        />
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
          {content.length}/200
        </div>
      </div>

      {/* 快捷工具栏 */}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          aria-label="插入表情"
        >
          <Smile className="w-4 h-4 text-muted-foreground" />
        </button>

        <button
          type="button"
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          aria-label="加粗"
        >
          <Bold className="w-4 h-4 text-muted-foreground" />
        </button>

        <button
          type="button"
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          aria-label="斜体"
        >
          <Italic className="w-4 h-4 text-muted-foreground" />
        </button>

        <button
          type="button"
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          aria-label="插入链接"
        >
          <Link className="w-4 h-4 text-muted-foreground" />
        </button>

        <button
          type="button"
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          aria-label="提及用户"
        >
          <AtSign className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* 表情选择器 */}
      {showEmojiPicker && (
        <div className="mt-2 p-3 bg-accent rounded-lg border border-input">
          <div className="grid grid-cols-8 gap-2">
            {['😀', '😂', '😍', '🥰', '😎', '🤩', '🥳', '😭', '😡', '🤯', '🥶', '😱', '🤠', '🥴', '😈', '👻'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className="text-xl transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}

      {/* 选项栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        {/* 颜色选择 */}
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-1.5">
            {DANMAKU_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setSelectedColor(color.value)}
                title={color.name}
                className={cn(
                  "w-6 h-6 rounded-full transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-tech-cyan",
                  selectedColor === color.value && "ring-2 ring-offset-1 ring-tech-cyan scale-110"
                )}
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
        </div>

        {/* 弹幕开关 */}
        <button
          type="button"
          onClick={() => setIsDanmaku(!isDanmaku)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-200",
            isDanmaku
              ? "bg-tech-cyan/20 text-tech-cyan border border-tech-cyan/30"
              : "bg-muted text-muted-foreground border border-transparent hover:bg-muted/80"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isDanmaku ? '弹幕模式' : '普通留言'}
        </button>

        {/* 发送按钮 */}
        <Button
          type="submit"
          disabled={isSubmitting || content.trim().length === 0}
          className="flex items-center gap-2 bg-gradient-to-r from-tech-cyan to-tech-lightcyan hover:opacity-90"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? '发送中...' : '发送留言'}
        </Button>
      </div>
    </form>
  );
}

export default memo(MessageInput);
