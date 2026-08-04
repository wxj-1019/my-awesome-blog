'use client';
import { useState, useCallback } from 'react';
import { Message, Reply } from '@/types';
import { formatDistanceToNow } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Trash2, MessageSquare, Heart, Reply as ReplyIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { deleteMessage, likeMessage, replyToMessage } from '@/services/messageService';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  onMessageDeleted?: (id: string) => void;
  onMessageUpdated?: (updatedMessage: Message) => void;
}
export default function MessageList({
  messages,
  currentUserId,
  onMessageDeleted,
  onMessageUpdated
}: MessageListProps) {
  const { themedClasses } = useThemedClasses();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [likedMessages, setLikedMessages] = useState<Record<string, boolean>>({});
  const [replies, setReplies] = useState<Record<string, boolean>>({});
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const handleDelete = useCallback(async (id: string) => {
    setMessageToDelete(id);
    setDeleteConfirmOpen(true);
  }, []);
  const confirmDelete = useCallback(async () => {
    if (!messageToDelete) {return;}
    setDeletingId(messageToDelete);
    try {
      await deleteMessage(messageToDelete);
      onMessageDeleted?.(messageToDelete);
    } catch (error) {
      setAlertMessage(error instanceof Error ? error.message : '删除失败');
      setAlertOpen(true);
    } finally {
      setDeletingId(null);
      setDeleteConfirmOpen(false);
      setMessageToDelete(null);
    }
  }, [messageToDelete, onMessageDeleted]);
  const handleLike = useCallback(async (id: string) => {
    try {
      const updatedMessage = await likeMessage(id);
      setLikedMessages(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
      onMessageUpdated?.(updatedMessage);
    } catch {
      setAlertMessage('点赞失败，请重试');
      setAlertOpen(true);
    }
  }, [onMessageUpdated]);
  const toggleReply = (id: string) => {
    setReplies(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  const handleReplySubmit = useCallback(async (id: string) => {
    const text = replyTexts[id];
    if (!text || text.trim().length === 0) {return;}
    try {
      const updatedMessage = await replyToMessage(id, text);
      onMessageUpdated?.(updatedMessage);
      // 清空输入框
      setReplyTexts(prev => ({
        ...prev,
        [id]: ''
      }));
      // 关闭回复框
      setReplies(prev => ({
        ...prev,
        [id]: false
      }));
    } catch {
      setAlertMessage('回复失败，请重试');
      setAlertOpen(true);
    }
  }, [replyTexts, onMessageUpdated]);
  const toggleReplies = useCallback((id: string) => {
    setExpandedReplies(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);
  if (messages.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="暂无留言"
        description="快来发表第一条吧！"
        className={cn(themedClasses.cardBgClass, "rounded-xl")}
      />
    );
  }
  return (
    <div className="space-y-4">
      <h3 className={cn(
        "text-lg font-semibold flex items-center gap-2",
        themedClasses.textClass
      )}>
        <MessageSquare className="w-5 h-5 text-tech-cyan" />
        全部留言 ({messages.length})
      </h3>
      <div className="space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "p-4 rounded-xl transition-transform duration-300",
              "hover:scale-[1.01]",
              themedClasses.cardBgClass
            )}
          >
            <div className="flex items-start gap-3">
              {/* 头像 */}
              <div className="flex-shrink-0">
                {message.author.avatar ? (
                  <>
                    {/* 留言作者头像可能来自外部任意来源，保留 <img> */}
                    <img
                      src={message.author.avatar}
                      alt={message.author.username}
                      className="w-10 h-10 rounded-full border-2 border-tech-cyan/30"
                    />
                  </>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tech-cyan to-tech-lightcyan flex items-center justify-center text-white font-bold">
                    {message.author.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-medium",
                      themedClasses.textClass
                    )}>
                      {message.author.username}
                    </span>
                    {message.isDanmaku && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full bg-tech-cyan/20 text-tech-cyan border border-tech-cyan/30"
                      >
                        弹幕
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-500 border border-purple-500/30">
                      Lv.{message.level || 1}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(message.created_at))}
                  </span>
                </div>
                <p className={cn(
                  "mt-1 text-sm leading-relaxed",
                  themedClasses.textClass
                )}>
                  {message.content}
                </p>
                {/* 操作按钮 */}
                <div className="flex items-center gap-4 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(message.id)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs",
                      likedMessages[message.id]
                        ? "text-red-500 hover:text-red-600"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Heart className={cn("w-3.5 h-3.5", likedMessages[message.id] && "fill-current")} />
                    {likedMessages[message.id] ? '已赞' : '点赞'} ({message.likes || 0})
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleReply(message.id)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ReplyIcon className="w-3.5 h-3.5" />
                    回复
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleReplies(message.id)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {expandedReplies[message.id] ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        收起回复
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        查看回复 ({message.replies?.length || 0})
                      </>
                    )}
                  </Button>
                </div>
                {/* 回复列表 */}
                {expandedReplies[message.id] && message.replies && message.replies.length > 0 && (
                  <div className="mt-3 space-y-2 pl-4 border-l-2 border-muted">
                    {message.replies.map((reply: Reply) => (
                      <div key={reply.id} className="py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{reply.author.username}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(reply.created_at))}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                {/* 回复框 */}
                {replies[message.id] && (
                  <div className="mt-3 pt-3 border-t border-muted">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyTexts[message.id] || ''}
                        onChange={(e) => setReplyTexts(prev => ({
                          ...prev,
                          [message.id]: e.target.value
                        }))}
                        placeholder="输入回复内容..."
                        className={cn(
                          "flex-1 px-3 py-1.5 text-sm rounded-lg",
                          "bg-background/50 border border-input",
                          "focus:outline-none focus:ring-1 focus:ring-tech-cyan"
                        )}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleReplySubmit(message.id)}
                        className="bg-tech-cyan hover:bg-tech-lightcyan text-white"
                      >
                        发送
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {/* 删除按钮 */}
              {currentUserId === message.author.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(message.id)}
                  disabled={deletingId === message.id}
                  className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="删除留言"
        description="删除后无法恢复，确定要删除这条留言吗？"
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
    </div>
  );
}