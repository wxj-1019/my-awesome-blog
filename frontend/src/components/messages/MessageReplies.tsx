'use client';
import { useState, useCallback, memo } from 'react';
import { Reply as ReplyIcon, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { LazyAvatar } from '@/components/ui/LazyImage';
import { Button } from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import type { Message, Reply } from '@/types';
interface MessageRepliesProps {
  message: Message;
  currentUser: { id: string; username: string } | null;
  onReply?: (content: string, parentReplyId?: string) => void;
  onLikeReply?: (replyId: string) => void;
  onDeleteReply?: (replyId: string) => void;
  expanded?: boolean;
  maxVisible?: number;
}
// 单个回复项
const ReplyItem = memo(function ReplyItem({
  reply,
  depth = 0,
  currentUser,
  onReply,
  onLikeReply,
  onDeleteReply,
  onToggleReply: _onToggleReply
}: {
  reply: Reply;
  depth?: number;
  currentUser: { id: string; username: string } | null;
  onReply?: (content: string, parentReplyId?: string) => void;
  onLikeReply?: (replyId: string) => void;
  onDeleteReply?: (replyId: string) => void;
  onToggleReply?: () => void;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const isOwner = currentUser?.id === reply.author.id;
  const maxDepth = 3; // 最大嵌套深度
  // 高亮@用户
  const highlightMentions = (content: string): string => {
    if (!reply.mentionedUsers || reply.mentionedUsers.length === 0) {
      return content;
    }
    return content.replace(
      /@(\w+)/g,
      '**@$1**'
    );
  };
  // 处理提交回复
  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      onReply?.(replyContent, reply.id);
      setReplyContent('');
      setIsReplying(false);
    }
  };
  // 处理点击回复
  const handleReplyClick = () => {
    if (currentUser) {
      setReplyContent(`@${reply.author.username} `);
      setIsReplying(true);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'relative',
        depth > 0 && 'ml-6 pl-4 border-l-2 border-white/10'
      )}
    >
      <div className="flex gap-2 py-2">
        <LazyAvatar
          src={reply.author.avatar}
          fallback={reply.author.username[0].toUpperCase()}
          className="w-6 h-6 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-white/80">
              {reply.author.username}
            </span>
            <span className="text-xs text-white/40">
              {formatDistanceToNow(new Date(reply.created_at), {
                addSuffix: true,
                locale: zhCN
              })}
            </span>
            {reply.isEdited && (
              <span className="text-xs text-white/30">已编辑</span>
            )}
          </div>
          <div className="text-xs text-white/70 break-words">
            <MarkdownRenderer
              content={highlightMentions(reply.content)}
              className="inline"
            />
          </div>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => onLikeReply?.(reply.id)}
              className={cn(
                'flex items-center gap-1 text-xs transition-colors',
                reply.likes && reply.likes > 0
                  ? 'text-tech-pink'
                  : 'text-white/40 hover:text-tech-pink'
              )}
            >
              <span className={cn(reply.likes && reply.likes > 0 && 'font-bold')}>
                {reply.likes || 0}
              </span>
              赞
            </button>
            <button
              onClick={handleReplyClick}
              className="text-xs text-white/40 hover:text-tech-cyan transition-colors"
            >
              回复
            </button>
            {isOwner && (
              <button
                onClick={() => onDeleteReply?.(reply.id)}
                className="text-xs text-white/40 hover:text-red-400 transition-colors"
              >
                删除
              </button>
            )}
          </div>
          {/* 回复输入框 */}
          <AnimatePresence>
            {isReplying && depth < maxDepth && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSubmitReply();
                      } else if (e.key === 'Escape') {
                        setIsReplying(false);
                        setReplyContent('');
                      }
                    }}
                    placeholder={`回复 @${reply.author.username}...`}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-black/30 border border-white/10 text-white text-xs focus:border-tech-cyan focus:outline-none"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleSubmitReply}
                    disabled={!replyContent.trim()}
                    className="px-3 py-1 text-xs bg-tech-cyan text-black hover:bg-tech-lightcyan"
                  >
                    发送
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* 嵌套回复 */}
          {reply.replies && reply.replies.length > 0 && depth < maxDepth && (
            <div className="mt-2 space-y-1">
              {reply.replies.map((nestedReply: Reply) => (
                <ReplyItem
                  key={nestedReply.id}
                  reply={nestedReply}
                  depth={depth + 1}
                  currentUser={currentUser}
                  onReply={onReply}
                  onLikeReply={onLikeReply}
                  onDeleteReply={onDeleteReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});
// 回复列表组件
export default function MessageReplies({
  message,
  currentUser,
  onReply,
  onLikeReply,
  onDeleteReply,
  expanded = false,
  maxVisible = 3
}: MessageRepliesProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [replyToDelete, setReplyToDelete] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const replies = message.replies || [];
  const replyCount = message.reply_count || replies.length;
  const hasReplies = replies.length > 0;
  // 处理提交回复
  const handleSubmitReply = useCallback(() => {
    if (replyContent.trim()) {
      onReply?.(replyContent);
      setReplyContent('');
      setShowReplyForm(false);
    }
  }, [replyContent, onReply]);
  // 处理回复某个回复
  const handleNestedReply = useCallback((content: string, parentReplyId?: string) => {
    onReply?.(content, parentReplyId);
  }, [onReply]);
  // 处理点赞回复
  const handleLikeReply = useCallback((replyId: string) => {
    onLikeReply?.(replyId);
  }, [onLikeReply]);
  // 处理删除回复
  const handleDeleteReply = useCallback((replyId: string) => {
    setReplyToDelete(replyId);
    setDeleteConfirmOpen(true);
  }, []);
  const confirmDeleteReply = useCallback(() => {
    if (replyToDelete) {
      onDeleteReply?.(replyToDelete);
      setDeleteConfirmOpen(false);
      setReplyToDelete(null);
    }
  }, [replyToDelete, onDeleteReply]);
  // 显示的回复
  const visibleReplies = isExpanded ? replies : replies.slice(0, maxVisible);
  return (
    <>
      <div className="mt-3 pt-3 border-t border-white/5">
        {/* 回复统计 */}
        {hasReplies && (
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-tech-cyan transition-colors"
            >
              <ReplyIcon className="w-3.5 h-3.5" />
              <span>
                {replyCount} 条回复{!isExpanded && replyCount > maxVisible && ` (显示前${maxVisible}条)`}
              </span>
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                className="transition-transform"
              >
                ▼
              </motion.span>
            </button>
          </div>
        )}
        {/* 回复列表 */}
        <AnimatePresence mode="wait">
        <motion.div
          key={isExpanded ? 'expanded' : 'collapsed'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-0.5"
        >
          {hasReplies ? (
            visibleReplies.map((reply: Reply) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                currentUser={currentUser}
                onReply={handleNestedReply}
                onLikeReply={handleLikeReply}
                onDeleteReply={handleDeleteReply}
              />
            ))
          ) : (
            <EmptyState
              size="sm"
              compact
              title="暂无回复"
              description="快来抢沙发吧"
              icon={MessageSquare}
            />
          )}
        </motion.div>
      </AnimatePresence>
      {/* 回复输入框 */}
      <AnimatePresence>
        {showReplyForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <div className="flex gap-2">
              <LazyAvatar
                src={undefined}
                fallback={currentUser?.username[0] || 'U'}
                className="w-6 h-6 flex-shrink-0"
              />
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmitReply();
                    } else if (e.key === 'Escape') {
                      setShowReplyForm(false);
                      setReplyContent('');
                    }
                  }}
                  placeholder="写下你的回复... (使用 @提及用户)"
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:border-tech-cyan focus:outline-none"
                  autoFocus
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/40">
                    {replyContent.length}/200
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowReplyForm(false);
                        setReplyContent('');
                      }}
                      className="text-xs"
                    >
                      取消
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim() || replyContent.length > 200}
                      className="px-4 py-1.5 text-xs bg-tech-cyan text-black hover:bg-tech-lightcyan"
                    >
                      回复
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 回复按钮 */}
      {!showReplyForm && (
        <motion.button
          onClick={() => {
            if (!currentUser) {
              setAlertMessage('请先登录');
              setAlertOpen(true);
              return;
            }
            setShowReplyForm(true);
          }}
          className="mt-2 flex items-center gap-1.5 text-xs text-white/40 hover:text-tech-cyan transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ReplyIcon className="w-3.5 h-3.5" />
          写回复
        </motion.button>
      )}
    </div>
    {/* 删除确认对话框 */}
    <ConfirmDialog
      isOpen={deleteConfirmOpen}
      onClose={() => setDeleteConfirmOpen(false)}
      onConfirm={confirmDeleteReply}
      title="删除回复"
      description="删除后无法恢复，确定要删除这条回复吗？"
      variant="danger"
      confirmText="确定删除"
      cancelText="取消"
    />
    {/* 提示对话框 */}
    <ConfirmDialog
      isOpen={alertOpen}
      onClose={() => setAlertOpen(false)}
      onConfirm={() => setAlertOpen(false)}
      title="提示"
      description={alertMessage}
      variant="info"
      confirmText="知道了"
      cancelText="取消"
    />
    </>
  );
}