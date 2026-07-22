'use client';
import { useState, useEffect, useRef } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tag, Eye, Share2, ThumbsUp, MessageSquare, TrendingUp, Award, Users } from 'lucide-react';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import { useCodeBlockEnhancement } from '@/hooks/useCodeBlockEnhancement';
import { getArticleById, getRelatedArticles } from '@/services/articleService';
import { getCommentTree, createComment } from '@/services/commentService';
import logger from '@/utils/logger';
import type { RelatedArticle, Article } from '@/types';
import { useLoading } from '@/context/loading-context';
import { useTheme } from '@/context/theme-context';
import MediaPlayer from '@/components/ui/MediaPlayer';
import ReadingProgressBar from '@/components/articles/ReadingProgressBar';
import ArticleHeroStage from '@/components/articles/ArticleHeroStage';
import ArticleTocRail from '@/components/articles/ArticleTocRail';
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
function addReplyToTree(comments: Comment[], parentId: string | null, newComment: Comment): Comment[] {
  if (!parentId) {
    return [newComment, ...comments];
  }

  return comments.map((comment) => {
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

export default function ArticleDetailPageContent({ prefetchedArticle }: ArticleDetailPageContentProps) {
  const params = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(prefetchedArticle ?? null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(!prefetchedArticle);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { themedClasses } = useThemedClasses();
  const { showLoading, hideLoading } = useLoading();
  const { resolvedTheme } = useTheme();
  // 与全站氛围背景/HeroSection 同源：暗色=月夜云海，亮色=奇幻鹿境
  // SSR 未 mounted 时 resolvedTheme 确定性默认 dark，与 HeroSection 处理一致
  const heroMedia =
    resolvedTheme === 'dark'
      ? { src: '/video/moonlit-clouds-field-HD-live.mp4', caption: '月夜云海' }
      : { src: '/video/fantasy-landscape-deer-HD-live.mp4', caption: '奇幻鹿境' };
  useCodeBlockEnhancement(contentRef);
  const readingProgress = useReadingProgress(contentRef);
  const activeHeading = useActiveHeading(toc);

  // 服务端已预取文章时，仅需加载相关文章和评论
  useEffect(() => {
    if (prefetchedArticle) {
      generateTableOfContents(prefetchedArticle.content);
      // 并行加载相关文章
      getRelatedArticles(params.id).then(setRelatedArticles).catch(() => {});
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
      });
      setComments((prev) => [newComment, ...prev]);
      setNewCommentContent('');
    } catch (err) {
      logger.error('发表评论失败:', err);
      alert(err instanceof Error ? err.message : '发表评论失败，请检查是否已登录');
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
      });
      setComments((prev) => addReplyToTree(prev, parentId, newReply));
    } catch (err) {
      logger.error('回复评论失败:', err);
      alert(err instanceof Error ? err.message : '回复评论失败，请检查是否已登录');
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
        accentActiveClass="bg-primary/20 text-primary font-medium"
        idleLinkClass="text-muted-foreground hover:text-primary"
      />
      <div className="max-w-7xl mx-auto pb-8">
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
                <MediaPlayer
                  mediaItems={[
                    {
                      type: 'video',
                      src: heroMedia.src,
                      alt: heroMedia.caption,
                      caption: heroMedia.caption,
                    },
                  ]}
                  autoPlay={true}
                  aspectRatio="aspect-[4/1]"
                />
              }
            />
            {/*
              窄 lg：TOC 浮层不占主宽；xl+：三栏（左 TOC | 正文 | 右相关）
            */}
            <div className="relative flex flex-col xl:flex-row gap-6 xl:gap-8 px-4 md:px-6">
              {/* 左轨 TOC：lg–xl 固定窄轨，xl+ 进文档流 */}
              <aside className="hidden lg:block lg:fixed lg:left-4 lg:top-28 lg:z-30 lg:w-48 xl:static xl:w-52 xl:shrink-0 xl:left-auto xl:top-auto order-1">
                <ArticleTocRail
                  variant="rail"
                  headings={toc}
                  activeId={activeHeading}
                  progress={readingProgress}
                  cardBgClass={cardBgClass}
                  textClass={textClass}
                  mutedTextClass={mutedTextClass}
                  accentActiveClass="bg-primary/20 text-primary font-medium"
                  idleLinkClass="text-muted-foreground hover:text-primary"
                />
              </aside>
              {/* 主内容：lg 为全宽（TOC 浮层），xl 与侧栏并排 */}
              <div className="flex-1 min-w-0 order-2 max-w-3xl mx-auto xl:mx-0 w-full">
                {/* padding=none 避免与默认 md 内边距叠加；ref 绑在正文根 */}
                <GlassCard
                  padding="none"
                  className={`mb-8 p-6 md:p-8 ${cardBgClass}`}
                >
                  <div ref={contentRef}>
                    <ArticleBodyReveal enabled>
                      <div
                        className={`prose prose-base md:prose-lg max-w-none dark:prose-invert leading-relaxed md:leading-[1.8] ${textClass}`}
                      >
                        <MarkdownRenderer content={article.content} />
                      </div>
                    </ArticleBodyReveal>
                  </div>
                </GlassCard>
                <div className="mb-8">
                  <h3 className={`text-lg font-semibold mb-3 ${textClass}`}>标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="border-border text-muted-foreground"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { icon: ThumbsUp, label: '点赞数', value: article.likes_count },
                    { icon: MessageSquare, label: '评论数', value: article.comments_count },
                    { icon: Share2, label: '分享数', value: article.shares_count },
                    { icon: Eye, label: '阅读量', value: article.view_count },
                  ].map(({ icon: Icon, label, value }) => (
                    <HoverLift key={label}>
                      <GlassCard padding="none" className={`p-4 text-center ${cardBgClass}`}>
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
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
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
                          <span className="text-sm">{article.author.reputation} 声誉</span>
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
                <GlassCard padding="none" className={`p-6 ${cardBgClass}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-semibold ${textClass}`}>
                      评论 ({commentsLoading ? '...' : comments.length})
                    </h3>
                  </div>
                  {commentsLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block h-8 w-8 border-4 border-tech-cyan border-t-transparent rounded-full animate-spin" />
                      <p className={`text-sm mt-2 ${mutedTextClass}`}>加载评论中...</p>
                    </div>
                  ) : commentsError ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-red-500">{commentsError}</p>
                    </div>
                  ) : (
                    <CommentTree
                      comments={comments}
                      onReply={handleReply}
                      onLike={() => {}}
                    />
                  )}
                  <div className="pt-6 mt-6 border-t border-dashed border-opacity-30">
                    <textarea
                      rows={4}
                      placeholder="写下你的评论..."
                      value={newCommentContent}
                      onChange={(e) => setNewCommentContent(e.target.value)}
                      disabled={isSubmittingComment}
                      className="w-full px-4 py-3 rounded-lg border bg-muted/40 border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={handleSubmitComment}
                        disabled={!newCommentContent.trim() || isSubmittingComment}
                      >
                        {isSubmittingComment ? '发表中...' : '发表评论'}
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </div>
              {/* 右轨：相关文章 — 窄屏在正文下，xl+ 侧栏 */}
              <aside className="w-full xl:w-56 2xl:w-64 space-y-6 order-3 shrink-0">
                {relatedArticles.length > 0 && (
                  <GlassCard
                    padding="none"
                    className={`p-6 sticky top-24 ${cardBgClass}`}
                  >
                    <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>
                      相关文章
                    </h3>
                    <div className="space-y-3">
                      {relatedArticles.map((relatedArticle) => (
                        <HoverLift key={relatedArticle.id}>
                          <Link href={`/articles/${relatedArticle.id}`}>
                            <div
                              className="p-3 rounded-lg transition-colors bg-muted/40 hover:bg-muted"
                            >
                              <h4
                                className={`font-medium line-clamp-2 ${textClass}`}
                              >
                                {relatedArticle.title}
                              </h4>
                              <div className="flex items-center text-xs mt-2 text-muted-foreground gap-2">
                                {relatedArticle.category?.name ? (
                                  <span>{relatedArticle.category.name}</span>
                                ) : null}
                                <Eye className="h-3 w-3" />
                                <span>{relatedArticle.view_count} 阅读</span>
                              </div>
                            </div>
                          </Link>
                        </HoverLift>
                      ))}
                    </div>
                  </GlassCard>
                )}
              </aside>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
