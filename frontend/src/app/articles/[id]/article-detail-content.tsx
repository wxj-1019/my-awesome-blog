'use client';
import { useState, useEffect, useRef } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Tag,
  Eye,
  Share2,
  ThumbsUp,
  MessageSquare,
  TrendingUp,
  Award,
  Users,
} from 'lucide-react';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import { useCodeBlockEnhancement } from '@/hooks/useCodeBlockEnhancement';
import { getArticleById, getRelatedArticles } from '@/services/articleService';
import { getCommentTree, createComment } from '@/services/commentService';
import { TOKEN_KEY } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import logger from '@/utils/logger';
import type { RelatedArticle, Article } from '@/types';
import { useLoading } from '@/context/loading-context';
import ReadingProgressBar from '@/components/articles/ReadingProgressBar';
import ArticleHeroStage from '@/components/articles/ArticleHeroStage';
import ArticleHeroCover from '@/components/articles/ArticleHeroCover';
import ArticleTocRail from '@/components/articles/ArticleTocRail';
import RelatedArticleRail from '@/components/articles/RelatedArticleRail';
import ArticleBodyReveal from '@/components/articles/ArticleBodyReveal';
import CommentTree from '@/components/articles/CommentTree';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { extractMarkdownHeadings } from '@/utils/markdown-headings';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useActiveHeading } from '@/hooks/useActiveHeading';
import { HoverLift } from '@/components/motion';
import { Comment } from '@/types';
/**
 * 将新评论插入到评论树的指定父评论下
 */
function addReplyToTree(
  comments: Comment[],
  parentId: string | null,
  newComment: Comment
): Comment[] {
  if (!parentId) {
    return [newComment, ...comments];
  }

  return comments.map(comment => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [newComment, ...(comment.replies || [])],
      };
    }
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: addReplyToTree(comment.replies, parentId, newComment),
      };
    }
    return comment;
  });
}

interface ArticleDetailPageContentProps {
  /** 服务端预取的文章数据，传入后跳过客户端请求 */
  prefetchedArticle?: Article | null;
}

export default function ArticleDetailPageContent({
  prefetchedArticle,
}: ArticleDetailPageContentProps) {
  const params = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(
    prefetchedArticle ?? null
  );
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(!prefetchedArticle);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>(
    []
  );
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  // 游客评论：按本地 token 判断登录态，未登录时展示昵称输入框
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [guestNickname, setGuestNickname] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const { themedClasses } = useThemedClasses();
  const { showLoading, hideLoading } = useLoading();
  useCodeBlockEnhancement(contentRef);
  const readingProgress = useReadingProgress(contentRef);
  const activeHeading = useActiveHeading(toc);

  // 挂载后同步登录态（客户端才可访问 localStorage）
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem(TOKEN_KEY));
  }, []);

  // 服务端已预取文章时，仅需加载相关文章和评论
  useEffect(() => {
    if (prefetchedArticle) {
      generateTableOfContents(prefetchedArticle.content);
      // 并行加载相关文章
      getRelatedArticles(params.id)
        .then(setRelatedArticles)
        .catch(() => {});
      return;
    }

    // 无预取数据时的完整客户端加载（兜底）
    const fetchArticleData = async () => {
      try {
        showLoading();
        setLoading(true);
        const articleData = await getArticleById(params.id);
        if (!articleData) {
          notFound();
        }
        setArticle(articleData);
        const relatedData = await getRelatedArticles(params.id);
        setRelatedArticles(relatedData);
        generateTableOfContents(articleData.content);
      } catch (err) {
        logger.error('获取文章数据失败:', err);
        setError('获取文章数据失败');
      } finally {
        hideLoading();
        setLoading(false);
      }
    };
    if (params.id) {
      fetchArticleData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // 加载文章评论
  useEffect(() => {
    if (!params.id) {
      return;
    }

    const fetchComments = async () => {
      setCommentsLoading(true);
      setCommentsError(null);
      try {
        const data = await getCommentTree(params.id);
        setComments(data);
      } catch (err) {
        logger.error('获取评论失败:', err);
        setCommentsError(err instanceof Error ? err.message : '获取评论失败');
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [params.id]);
  // 生成目录：与 MarkdownRenderer 共用同一套标题解析/slug 规则
  const generateTableOfContents = (content: string) => {
    setToc(extractMarkdownHeadings(content));
  };
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  // 处理点赞
  const handleLike = () => {
    setIsLiked(!isLiked);
  };
  // 处理收藏
  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };
  // 处理关注作者
  const handleFollowAuthor = () => {
    setIsFollowingAuthor(!isFollowingAuthor);
  };
  // 处理发表评论
  const handleSubmitComment = async () => {
    if (!newCommentContent.trim() || !article) {
      return;
    }

    setIsSubmittingComment(true);
    try {
      const newComment = await createComment({
        content: newCommentContent.trim(),
        article_id: article.id,
        // 游客带上昵称；登录用户由后端按账号身份处理
        ...(!isLoggedIn ? { nickname: guestNickname.trim() } : {}),
      });
      setComments(prev => [newComment, ...prev]);
      setNewCommentContent('');
    } catch (err) {
      logger.error('发表评论失败:', err);
      alert(
        err instanceof Error ? err.message : '发表评论失败，请检查是否已登录'
      );
    } finally {
      setIsSubmittingComment(false);
    }
  };
  // 处理回复评论
  const handleReply = async (parentId: string, content: string) => {
    if (!content.trim() || !article) {
      return;
    }

    setIsSubmittingComment(true);
    try {
      const newReply = await createComment({
        content: content.trim(),
        article_id: article.id,
        parent_id: parentId,
        // 游客带上昵称；登录用户由后端按账号身份处理
        ...(!isLoggedIn ? { nickname: guestNickname.trim() } : {}),
      });
      setComments(prev => addReplyToTree(prev, parentId, newReply));
    } catch (err) {
      logger.error('回复评论失败:', err);
      alert(
        err instanceof Error ? err.message : '回复评论失败，请检查是否已登录'
      );
    } finally {
      setIsSubmittingComment(false);
    }
  };
  // 主题相关样式
  const cardBgClass = themedClasses.cardBgClass;
  const textClass = themedClasses.textClass;
  const accentClass = 'text-primary';
  const mutedTextClass = themedClasses.mutedTextClass;
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <h2 className={`text-2xl font-bold mb-4 ${accentClass}`}>错误</h2>
          <p className={mutedTextClass}>{error}</p>
          <Link href="/articles" prefetch={false}>
            <Button className="mt-4">返回文章列表</Button>
          </Link>
        </GlassCard>
      </div>
    );
  }
  return (
    <div className="min-h-screen relative">
      <ReadingProgressBar progress={readingProgress} />
      {/* 移动端 TOC 抽屉 */}
      <ArticleTocRail
        variant="drawer"
        headings={toc}
        activeId={activeHeading}
        progress={readingProgress}
        cardBgClass={cardBgClass}
        textClass={textClass}
        mutedTextClass={mutedTextClass}
        accentActiveClass="border-l-2 border-primary bg-primary/5 text-primary font-medium"
        idleLinkClass="text-muted-foreground hover:text-primary"
      />
      <div className="max-w-[1440px] mx-auto pb-8">
        {loading ? (
          <div className="px-4 pt-12 space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : article ? (
          <>
            <ArticleHeroStage
              article={article}
              isLiked={isLiked}
              isBookmarked={isBookmarked}
              onLike={handleLike}
              onBookmark={handleBookmark}
              formatDate={formatDate}
              textClass={textClass}
              mediaSlot={
                /* 封面图 + Ken Burns 缓推，替代原视频（视频比例与容器冲突占不满） */
                <ArticleHeroCover
                  src={article.cover_image || '/covers/default-cover.svg'}
                  alt={article.title}
                />
              }
            />
            {/* xl+ 三栏阅读布局：左目录 | 正文 | 相关文章 */}
            <div className="relative grid grid-cols-1 gap-6 px-4 md:px-6 xl:grid-cols-[13rem_minmax(0,1fr)_14rem] 2xl:grid-cols-[14rem_minmax(0,50rem)_16rem] 2xl:gap-8 xl:items-start xl:justify-center">
              <aside
                className="hidden xl:block xl:sticky xl:top-24 xl:self-start"
                aria-label="文章目录"
              >
                <ArticleTocRail
                  variant="rail"
                  headings={toc}
                  activeId={activeHeading}
                  progress={readingProgress}
                  cardBgClass={cardBgClass}
                  textClass={textClass}
                  mutedTextClass={mutedTextClass}
                  accentActiveClass="border-l-2 border-primary bg-primary/5 text-primary font-medium"
                  idleLinkClass="text-muted-foreground hover:text-primary"
                />
              </aside>
              <div className="min-w-0 w-full max-w-[50rem] justify-self-center">
                {/* padding=none 避免与默认 md 内边距叠加；ref 绑在正文根 */}
                <GlassCard
                  padding="none"
                  className={`mb-8 p-6 md:p-8 ${cardBgClass}`}
                >
                  <div ref={contentRef}>
                    <ArticleBodyReveal enabled>
                      <div
                        className={`prose prose-base md:prose-lg max-w-none dark:prose-invert font-serif leading-relaxed md:leading-[1.8] ${textClass}`}
                      >
                        <MarkdownRenderer content={article.content} />
                      </div>
                    </ArticleBodyReveal>
                  </div>
                </GlassCard>
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3 text-white">
                    标签
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="border-white/30 text-white/80"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    {
                      icon: ThumbsUp,
                      label: '点赞数',
                      value: article.likes_count,
                    },
                    {
                      icon: MessageSquare,
                      label: '评论数',
                      value: article.comments_count,
                    },
                    {
                      icon: Share2,
                      label: '分享数',
                      value: article.shares_count,
                    },
                    { icon: Eye, label: '阅读量', value: article.view_count },
                  ].map(({ icon: Icon, label, value }) => (
                    <HoverLift key={label}>
                      <GlassCard
                        padding="none"
                        className={`p-4 text-center ${cardBgClass}`}
                      >
                        <div className="flex items-center justify-center">
                          <Icon className="h-6 w-6 mr-2 text-tech-cyan" />
                          <span className="text-2xl font-bold">{value}</span>
                        </div>
                        <p className={`text-sm ${mutedTextClass}`}>{label}</p>
                      </GlassCard>
                    </HoverLift>
                  ))}
                </div>
                <GlassCard padding="none" className={`mb-8 p-6 ${cardBgClass}`}>
                  <div className="flex flex-col md:flex-row items-start">
                    <div className="mr-4 mb-4 md:mb-0">
                      {article.author.avatar ? (
                        /* 作者头像来源可控性不一，保留 <img> 并给首字母兜底 */
                        <img
                          src={article.author.avatar}
                          alt={`${article.author.username} 的头像`}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                      ) : (
                        /* 无头像时用首字母占位，token 化避免深色下亮灰补丁 */
                        <div className="w-16 h-16 rounded-xl bg-primary/15 text-primary flex items-center justify-center text-2xl font-bold">
                          {article.author.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between">
                        <h3 className={`text-lg font-semibold ${textClass}`}>
                          {article.author.username}
                        </h3>
                        <Button
                          variant={isFollowingAuthor ? 'default' : 'outline'}
                          size="sm"
                          onClick={handleFollowAuthor}
                          className={
                            isFollowingAuthor
                              ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                              : 'border-border hover:bg-muted/40 text-foreground'
                          }
                        >
                          {isFollowingAuthor ? '已关注' : '关注'}
                        </Button>
                      </div>
                      <p className={mutedTextClass}>
                        {article.author.bio || '暂无个人简介'}
                      </p>
                      <div className="flex flex-wrap gap-4 mt-4">
                        <div className="flex items-center">
                          <Award className="h-4 w-4 mr-2 text-tech-cyan" />
                          <span className="text-sm">
                            {article.author.reputation} 声誉
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-tech-cyan" />
                          <span className="text-sm">
                            {article.author.followers_count} 关注者
                          </span>
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2 text-tech-cyan" />
                          <span className="text-sm">活跃作者</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
                {/* 移动副本与桌面右轨通过 xl display 类互斥，任一断点只暴露一份内容。 */}
                <RelatedArticleRail
                  articles={relatedArticles}
                  heading="继续阅读"
                  className={cn('mb-8 xl:hidden', cardBgClass)}
                />
                <GlassCard padding="none" className={`p-6 ${cardBgClass}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-semibold ${textClass}`}>
                      评论 ({commentsLoading ? '...' : comments.length})
                    </h3>
                  </div>
                  {commentsLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block h-8 w-8 border-4 border-tech-cyan border-t-transparent rounded-full animate-spin" />
                      <p className={`text-sm mt-2 ${mutedTextClass}`}>
                        加载评论中...
                      </p>
                    </div>
                  ) : commentsError ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-destructive">
                        {commentsError}
                      </p>
                    </div>
                  ) : (
                    <CommentTree
                      comments={comments}
                      onReply={handleReply}
                      onLike={() => {}}
                    />
                  )}
                  <div className="pt-6 mt-6 border-t border-dashed border-border">
                    {!isLoggedIn ? (
                      <div className="mb-3">
                        <label
                          htmlFor="guest-comment-nickname"
                          className="block text-sm text-muted-foreground mb-1.5"
                        >
                          昵称（选填，默认「匿名游客」）
                        </label>
                        <input
                          id="guest-comment-nickname"
                          type="text"
                          value={guestNickname}
                          onChange={e => setGuestNickname(e.target.value)}
                          maxLength={50}
                          placeholder="你的昵称..."
                          className="w-full px-4 py-2.5 rounded-lg border bg-muted/40 border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        />
                      </div>
                    ) : null}
                    <textarea
                      rows={4}
                      placeholder="写下你的评论..."
                      value={newCommentContent}
                      onChange={e => setNewCommentContent(e.target.value)}
                      disabled={isSubmittingComment}
                      className="w-full px-4 py-3 rounded-lg border bg-muted/40 border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={handleSubmitComment}
                        disabled={
                          !newCommentContent.trim() || isSubmittingComment
                        }
                      >
                        {isSubmittingComment ? '发表中...' : '发表评论'}
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </div>
              <aside
                className="hidden xl:block xl:sticky xl:top-24 xl:self-start"
                aria-label="相关文章"
              >
                <RelatedArticleRail
                  articles={relatedArticles}
                  className={cardBgClass}
                />
              </aside>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
