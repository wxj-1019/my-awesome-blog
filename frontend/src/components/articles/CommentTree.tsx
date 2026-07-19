'use client';
import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { Button } from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import EmptyState from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { ThumbsUp, MessageSquare, ChevronDown, ChevronUp, User, Clock } from 'lucide-react';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import { Comment } from '@/types';
import { formatDateRelative } from '@/utils/dateFormat';
interface CommentTreeProps {
  comments: Comment[];
  depth?: number;
  maxDepth?: number;
  onReply?: (commentId: string, content: string) => void;
  onLike?: (commentId: string) => void;
  className?: string;
}
interface CommentItemProps {
  comment: Comment;
  depth: number;
  maxDepth: number;
  onReply?: (commentId: string, content: string) => void;
  onLike?: (commentId: string) => void;
}
function CommentItem({ comment, depth, maxDepth, onReply, onLike }: CommentItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const { themedClasses } = useThemedClasses();
  const textClass = themedClasses.textClass;
  const mutedTextClass = themedClasses.mutedTextClass;
  const cardBgClass = themedClasses.cardBgClass;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const canReply = depth < maxDepth;
  const handleLike = useCallback(() => {
    onLike?.(comment.id);
  }, [onLike, comment.id]);
  const handleReply = useCallback(() => {
    if (replyContent.trim()) {
      onReply?.(comment.id, replyContent.trim());
      setReplyContent('');
      setIsReplying(false);
    }
  }, [onReply, replyContent, comment.id]);
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);
  const toggleReplying = useCallback(() => {
    setIsReplying(prev => !prev);
  }, []);
  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.2
      }
    }
  };
  const repliesVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: {
        duration: 0.3
      }
    }
  };
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={itemVariants}
      className={cn('mb-4', depth > 0 && 'ml-8 border-l-2 border-tech-cyan/20 pl-4')}
    >
      <GlassCard className={cn('p-4', depth === 0 ? '' : 'bg-glass/10', cardBgClass)}>
        <div className="flex items-start gap-3">
          <div className={cn(
            'flex-shrink-0 rounded-full flex items-center justify-center',
            depth === 0 ? 'w-10 h-10' : 'w-8 h-8',
            'bg-primary/20'
          )}>
            <User className={cn(depth === 0 ? 'w-5 h-5' : 'w-4 h-4', 'text-tech-cyan')} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={cn('font-medium', depth === 0 ? 'text-sm' : 'text-xs', textClass)}>
                  {comment.author.username}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatDateRelative(comment.createdAt)}</span>
                </div>
              </div>
              {hasReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleExpanded}
                  className="text-xs h-6 px-2 text-muted-foreground hover:text-primary"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      收起 {comment.replies?.length}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      展开 {comment.replies?.length}
                    </>
                  )}
                </Button>
              )}
            </div>
            <p className={cn('text-sm leading-relaxed mb-3', mutedTextClass)}>
              {comment.content}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className="text-xs h-7 px-2 text-muted-foreground hover:text-primary"
              >
                <ThumbsUp className="w-3 h-3 mr-1" />
                {comment.likes}
              </Button>
              {canReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleReplying}
                  className="text-xs h-7 px-2 text-muted-foreground hover:text-primary"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  {isReplying ? '取消' : '回复'}
                </Button>
              )}
              <AnimatePresence>
                {isReplying && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3"
                  >
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="写下你的回复..."
                      rows={3}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg text-sm resize-none',
                        'bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground',
                        'focus:outline-none focus:ring-2 focus:ring-primary'
                      )}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleReplying}
                        className="text-xs"
                      >
                        取消
                      </Button>
                      <Button size="sm" onClick={handleReply} className="text-xs">
                        发送
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </GlassCard>
      <AnimatePresence>
        {hasReplies && isExpanded && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={repliesVariants}
            className="mt-2 space-y-2"
          >
            {comment.replies?.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                maxDepth={maxDepth}
                onReply={onReply}
                onLike={onLike}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
const CommentItemWithMemo = memo(CommentItem);
CommentItemWithMemo.displayName = 'CommentItem';
function CommentTree({
  comments,
  depth = 0,
  maxDepth = 3,
  onReply,
  onLike,
  className
}: CommentTreeProps) {
  const { themedClasses } = useThemedClasses();
  const cardBgClass = themedClasses.cardBgClass;
  if (comments.length === 0) {
    return (
      <GlassCard className={cn(cardBgClass)}>
        <EmptyState
          size="sm"
          compact
          icon={MessageSquare}
          title="暂无评论"
          description="快来发表第一条评论吧！"
        />
      </GlassCard>
    );
  }
  return (
    <div className={cn('space-y-4', className)}>
      {comments.map((comment) => (
        <CommentItemWithMemo
          key={comment.id}
          comment={comment}
          depth={depth}
          maxDepth={maxDepth}
          onReply={onReply}
          onLike={onLike}
        />
      ))}
    </div>
  );
}
const CommentTreeWithMemo = memo(CommentTree);
CommentTreeWithMemo.displayName = 'CommentTree';
export default CommentTreeWithMemo;
