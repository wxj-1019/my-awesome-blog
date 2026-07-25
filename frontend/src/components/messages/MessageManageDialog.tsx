'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { Pin, Star, Tag, Plus, X as CloseIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';

interface MessageManageDialogProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
  onTogglePin: (messageId: string, isPinned: boolean) => Promise<void>;
  onToggleFeature: (messageId: string, isFeatured: boolean) => Promise<void>;
  onUpdateTags: (messageId: string, tags: string[]) => Promise<void>;
}

// 常用标签建议
const SUGGESTED_TAGS = [
  '精选', '优质', '讨论', '问答', '分享', '技术', '生活',
  '娱乐', '有趣', '创意', '学习', '求助', '感谢', '建议'
];

function MessageManageDialog({
  message,
  isOpen,
  onClose,
  onTogglePin,
  onToggleFeature,
  onUpdateTags
}: MessageManageDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // 初始化标签
  useEffect(() => {
    if (message && message.tags) {
      setTags([...message.tags]);
    }
  }, [message]);

  // 添加标签
  const handleAddTag = useCallback(() => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  }, [newTag, tags]);

  // 移除标签
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  }, [tags]);

  // 添加建议标签
  const handleAddSuggestedTag = useCallback((tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  }, [tags]);

  // 切换置顶
  const handleTogglePin = async () => {
    if (!message) {return;}
    setIsSubmitting(true);
    try {
      await onTogglePin(message.id, !message.isPinned);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 切换精华
  const handleToggleFeature = async () => {
    if (!message) {return;}
    setIsSubmitting(true);
    try {
      await onToggleFeature(message.id, !message.isFeatured);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 保存标签
  const handleSaveTags = async () => {
    if (!message) {return;}
    setIsSubmitting(true);
    try {
      await onUpdateTags(message.id, tags);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理关闭
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  if (!message) {return null;}

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-slate-900 border border-white/20 rounded-xl p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题 */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">内容管理</h3>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-white/50 hover:text-white transition-colors disabled:opacity-50"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* 留言预览 */}
            <div className="mb-4 p-3 bg-black/30 rounded-lg border border-white/10">
              <p className="text-xs text-white/50 mb-1">留言内容</p>
              <p className="text-sm text-white/70 line-clamp-2">{message.content}</p>
              <div className="mt-2 text-xs text-white/40">
                @{message.author.username} · {new Date(message.created_at).toLocaleString()}
              </div>
            </div>

            <div className="space-y-6">
              {/* 置顶 */}
              <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <Pin className={cn(
                    "w-5 h-5",
                    message.isPinned ? "text-tech-cyan" : "text-white/40"
                  )} />
                  <div>
                    <p className="text-sm font-medium text-white">置顶留言</p>
                    <p className="text-xs text-white/40">
                      {message.isPinned ? "已置顶到顶部" : "将留言置顶到顶部"}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleTogglePin}
                  disabled={isSubmitting}
                  variant={message.isPinned ? "outline" : "default"}
                  className={cn(
                    "px-4 py-2 text-sm",
                    message.isPinned
                      ? "border-red-500/50 text-red-400 hover:bg-red-500/10"
                      : "bg-tech-cyan text-black hover:bg-tech-lightcyan"
                  )}
                >
                  {message.isPinned ? "取消置顶" : "置顶"}
                </Button>
              </div>

              {/* 精华 */}
              <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <Star className={cn(
                    "w-5 h-5",
                    message.isFeatured ? "text-yellow-400" : "text-white/40"
                  )} />
                  <div>
                    <p className="text-sm font-medium text-white">精华留言</p>
                    <p className="text-xs text-white/40">
                      {message.isFeatured ? "已标记为精华" : "标记为精华留言"}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleToggleFeature}
                  disabled={isSubmitting}
                  variant={message.isFeatured ? "outline" : "default"}
                  className={cn(
                    "px-4 py-2 text-sm",
                    message.isFeatured
                      ? "border-red-500/50 text-red-400 hover:bg-red-500/10"
                      : "bg-yellow-500 text-black hover:bg-yellow-400"
                  )}
                >
                  {message.isFeatured ? "取消精华" : "设为精华"}
                </Button>
              </div>

              {/* 标签管理 */}
              <div className="p-4 bg-black/30 rounded-lg border border-white/10 space-y-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-tech-cyan" />
                  <p className="text-sm font-medium text-white">标签管理</p>
                </div>

                {/* 当前标签 */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center gap-1 px-3 py-1 rounded-full bg-tech-cyan/20 border border-tech-cyan/30 text-tech-cyan text-sm"
                      >
                        #{tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-400"
                        >
                          <CloseIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 添加新标签 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="输入新标签..."
                    className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:border-tech-cyan focus:outline-none"
                  />
                  <Button
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                    className="px-3 py-2 bg-tech-cyan text-black hover:bg-tech-lightcyan"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* 建议标签 */}
                <div className="space-y-2">
                  <p className="text-xs text-white/40">建议标签：</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleAddSuggestedTag(tag)}
                        className="px-3 py-1 rounded-full border border-white/10 text-white/70 text-xs hover:bg-white/5 hover:border-tech-cyan/30 hover:text-tech-cyan transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                关闭
              </Button>
              <Button
                onClick={handleSaveTags}
                disabled={isSubmitting}
                className="flex-1 bg-tech-cyan text-black hover:bg-tech-lightcyan"
              >
                {isSubmitting ? '保存中...' : '保存更改'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(MessageManageDialog);
