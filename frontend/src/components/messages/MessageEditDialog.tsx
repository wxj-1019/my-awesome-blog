'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { canEditMessage, validateMessage } from '@/services/messageService';
import type { Message } from '@/types';

interface MessageEditDialogProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newContent: string) => Promise<void>;
}

export default function MessageEditDialog({
  message,
  isOpen,
  onClose,
  onConfirm
}: MessageEditDialogProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // 初始化内容
  useEffect(() => {
    if (message) {
      setContent(message.content);
      setError(null);
    }
  }, [message, isOpen]);

  // 计算剩余编辑时间
  useEffect(() => {
    if (!message) {return;}

    const updateTimeLeft = () => {
      const created = new Date(message.created_at).getTime();
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      const remaining = fiveMinutes - (now - created);

      if (remaining <= 0) {
        setTimeLeft('已过期');
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${minutes}分${seconds}秒`);
    };

    updateTimeLeft();
    const timer = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [message]);

  // 检查是否可编辑
  const isEditable = message ? canEditMessage(message.created_at) : false;

  // 处理提交
  const handleSubmit = async () => {
    if (!message || !isEditable) {return;}

    // 验证内容
    const validation = validateMessage(content);
    if (!validation.isValid) {
      setError(validation.error || '内容验证失败');
      return;
    }

    // 检查内容是否有变化
    if (content.trim() === message.content.trim()) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm(content.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '编辑失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理关闭
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!message) {return null;}

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-tech-cyan" />
                <h3 className="text-lg font-bold text-white">编辑留言</h3>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-white/50 hover:text-white transition-colors disabled:opacity-50"
                aria-label="关闭"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* 原始内容 */}
            <div className="mb-4 p-3 bg-black/30 rounded-lg border border-white/10">
              <p className="text-xs text-white/50 mb-1">原始内容</p>
              <p className="text-sm text-white/70 line-clamp-2">{message.content}</p>
            </div>

            {/* 编辑框 */}
            <div className="space-y-2 mb-4">
              <Textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setError(null);
                }}
                placeholder="编辑您的留言..."
                disabled={!isEditable || isSubmitting}
                className={cn(
                  'bg-black/40 border-white/20 text-white min-h-[120px] resize-none',
                  !isEditable && 'opacity-50 cursor-not-allowed'
                )}
              />

              {/* 字数统计 */}
              <div className="flex justify-between text-xs">
                <span className={cn(
                  content.length > 200 ? 'text-red-400' : 'text-white/40'
                )}>
                  {content.length}/200
                </span>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-400">{error}</span>
              </motion.div>
            )}

            {/* 时间提醒 */}
            <div className={cn(
              'flex items-center gap-2 p-3 mb-4 rounded-lg border',
              isEditable
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-red-500/10 border-red-500/30'
            )}>
              <Clock className={cn(
                'w-4 h-4',
                isEditable ? 'text-yellow-400' : 'text-red-400'
              )} />
              <span className={cn(
                'text-sm',
                isEditable ? 'text-yellow-400' : 'text-red-400'
              )}>
                {isEditable
                  ? `剩余编辑时间: ${timeLeft}`
                  : '编辑时间已过期（发布后5分钟内可编辑）'}
              </span>
            </div>

            {/* 按钮 */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isEditable || isSubmitting || content.trim() === message.content.trim()}
                className={cn(
                  'flex-1',
                  isEditable
                    ? 'bg-tech-cyan text-black hover:bg-tech-lightcyan'
                    : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4 mr-2" />
                    保存修改
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
