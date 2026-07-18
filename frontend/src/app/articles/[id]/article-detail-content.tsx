'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Calendar, Tag, User, Eye, Share2, Bookmark, ArrowLeft, Clock, ThumbsUp, MessageSquare, TrendingUp, Award, Users } from 'lucide-react';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import { useCodeBlockEnhancement } from '@/hooks/useCodeBlockEnhancement';
import { getArticleById, getRelatedArticles } from '@/services/articleService';
import { getCommentTree, createComment } from '@/services/commentService';
import logger from '@/utils/logger';
import type { RelatedArticle, Article } from '@/types';
import { useLoading } from '@/context/loading-context';
import { Progress } from '@/components/ui/progress';
import MediaPlayer from '@/components/ui/MediaPlayer';
import ReadingProgressBar from '@/components/articles/ReadingProgressBar';
import CommentTree from '@/components/articles/CommentTree';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import SocialShare from '@/components/social/SocialShare';
import { extractMarkdownHeadings } from '@/utils/markdown-headings';
import { env } from '@/lib/env';
import { Comment } from '@/types';
// 将 RelatedArticle 转换为 Article 类型的辅助函数
const convertToArticle = (related: RelatedArticle): Article => {
  return {
    id: related.id,
    title: related.title,
    content: '',
    excerpt: related.excerpt,
    is_published: true,
    view_count: related.view_count,
    created_at: related.published_at,
    updated_at: related.published_at,
    published_at: related.published_at,
    author_id: '1',
    category_id: undefined,
    cover_image: undefined,
    read_time: 0,
    likes_count: 0,
    comments_count: 0,
    shares_count: 0,
    author: {
      id: '1',
      username: '作者',
      email: 'author@example.com',
      avatar: undefined,
      bio: undefined,
      reputation: 100,
      followers_count: 500,
    },
    category: {
      id: '1',
      name: related.category?.name || '未分类',
      slug: 'category',
      description: '',
    },
    tags: [],
  };
};

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
  const [activeHeading, setActiveHeading] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { themedClasses, getThemeClass } = useThemedClasses();
  const { showLoading, hideLoading } = useLoading();
  useCodeBlockEnhancement(contentRef);

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
  // 监听滚动事件以高亮当前标题并计算阅读进度
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      // 高亮当前标题
      for (const item of toc) {
        const element = document.getElementById(item.id);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveHeading(item.id);
        }
      }
      // 计算阅读进度
      if (contentRef.current) {
        const content = contentRef.current;
        const contentTop = content.offsetTop;
        const contentHeight = content.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrollTop = window.scrollY;
        const progress = Math.min(
          100,
          Math.max(
            0,
            ((scrollTop - contentTop + windowHeight) / contentHeight) * 100
          )
        );
        setReadingProgress(Math.round(progress));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc]);
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
  const accentClass = getThemeClass(
    'text-tech-cyan',
    'text-blue-600'
  );
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
    <div className="min-h-screen bg-background relative">
      {/* 阅读进度条 */}
      <ReadingProgressBar targetRef={contentRef} />
      {/* 媒体播放组件 - 改为相对定位，占据正常文档流 */}
      <div className="h-[30vh] overflow-hidden relative z-10">
        {article && (
          <MediaPlayer
            mediaItems={[
              {
                type: 'video',
                src: '/video/falling-star-sky-lake-silhouette-live-wallpaper.mp4',
                alt: '星空湖景动态壁纸',
                caption: '星空湖景动态壁纸'
              }
            ]}
            autoPlay={true}
            aspectRatio="aspect-[4/1]"
          />
        )}
      </div>
      <div className="max-w-7xl mx-auto pt-12 pb-8">
        {/* 返回按钮 */}
        <div className="inline-block mt-6 ml-4">
          <Link href="/articles" prefetch={false}>
            <Button variant="ghost" className={getThemeClass('text-foreground hover:text-tech-cyan', 'text-gray-800 hover:text-blue-600')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回文章列表
            </Button>
          </Link>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 主内容区 */}
          <div className="lg:w-2/3">
            {loading ? (
              <div className="space-y-6">
                <Skeleton className="h-12 w-3/4" />
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-64 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              </div>
            ) : article ? (
              <>
                {/* 文章头部 */}
                <div className="mb-8">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    {article.category && (
                      <Badge variant="secondary" className={getThemeClass(
                        'bg-tech-cyan/20 text-tech-cyan',
                        'bg-blue-100 text-blue-800'
                      )}>
                        {article.category.name}
                      </Badge>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{article.read_time} 分钟阅读</span>
                    </div>
                  </div>
                  <motion.h1
                    layoutId={`article-title-${article.id}`}
                    className={`text-3xl md:text-4xl font-bold mb-4 ${textClass}`}
                  >
                    {article.title}
                  </motion.h1>
                  <div className="flex flex-wrap items-center justify-between pb-6 border-b border-dashed border-opacity-30">
                    <div className="flex items-center space-x-4 mb-4 md:mb-0">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        <span>{article.author.username}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{formatDate(article.published_at)}</span>
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-2" />
                        <span>{article.view_count} 次阅读</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLike}
                        className={`flex items-center ${isLiked ? 'text-red-500' : ''} ${getThemeClass(
                          'border-glass-border hover:bg-glass/40 text-foreground',
                          'border-gray-300 hover:bg-gray-50 text-gray-800'
                        )}`}
                      >
                        <ThumbsUp className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                        {isLiked ? '已点赞' : '点赞'}
                        <span className="ml-1">({article.likes_count})</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBookmark}
                        className={`flex items-center ${isBookmarked ? 'text-yellow-500' : ''} ${getThemeClass(
                          'border-glass-border hover:bg-glass/40 text-foreground',
                          'border-gray-300 hover:bg-gray-50 text-gray-800'
                        )}`}
                      >
                        <Bookmark className={`h-4 w-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                        {isBookmarked ? '已收藏' : '收藏'}
                      </Button>
                      <SocialShare
                        url={`${env.NEXT_PUBLIC_SITE_URL}/articles/${article.id}`}
                        title={article.title}
                        description={article.excerpt}
                      />
                    </div>
                  </div>
                </div>
                {/* 文章内容 */}
                <GlassCard ref={contentRef} className={`mb-8 p-6 md:p-8 ${cardBgClass}`}>
                  <div className={`prose max-w-none ${getThemeClass('prose-invert', '')} ${textClass}`}>
                    <MarkdownRenderer content={article.content} />
                  </div>
                </GlassCard>
                {/* 标签 */}
                <div className="mb-8">
                  <h3 className={`text-lg font-semibold mb-3 ${textClass}`}>标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className={getThemeClass(
                          'border-glass-border text-foreground/80',
                          'border-gray-300 text-gray-700'
                        )}>
                        <Tag className="h-3 w-3 mr-1" />
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                {/* 社交互动区 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <GlassCard className={`p-4 text-center ${cardBgClass}`}>
                    <div className="flex items-center justify-center">
                      <ThumbsUp className="h-6 w-6 mr-2 text-tech-cyan" />
                      <span className="text-2xl font-bold">{article.likes_count}</span>
                    </div>
                    <p className={`text-sm ${mutedTextClass}`}>点赞数</p>
                  </GlassCard>
                  <GlassCard className={`p-4 text-center ${cardBgClass}`}>
                    <div className="flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 mr-2 text-tech-cyan" />
                      <span className="text-2xl font-bold">{article.comments_count}</span>
                    </div>
                    <p className={`text-sm ${mutedTextClass}`}>评论数</p>
                  </GlassCard>
                  <GlassCard className={`p-4 text-center ${cardBgClass}`}>
                    <div className="flex items-center justify-center">
                      <Share2 className="h-6 w-6 mr-2 text-tech-cyan" />
                      <span className="text-2xl font-bold">{article.shares_count}</span>
                    </div>
                    <p className={`text-sm ${mutedTextClass}`}>分享数</p>
                  </GlassCard>
                  <GlassCard className={`p-4 text-center ${cardBgClass}`}>
                    <div className="flex items-center justify-center">
                      <Eye className="h-4 w-4 mr-2 text-tech-cyan" />
                      <span className="text-2xl font-bold">{article.view_count}</span>
                    </div>
                    <p className={`text-sm ${mutedTextClass}`}>阅读量</p>
                  </GlassCard>
                </div>
                {/* 作者信息 */}
                <GlassCard className={`mb-8 p-6 ${cardBgClass}`}>
                  <div className="flex flex-col md:flex-row items-start">
                    <div className="mr-4 mb-4 md:mb-0">
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between">
                        <h3 className={`text-lg font-semibold ${textClass}`}>{article.author.username}</h3>
                        <Button
                          variant={isFollowingAuthor ? "default" : "outline"}
                          size="sm"
                          onClick={handleFollowAuthor}
                          className={isFollowingAuthor
                            ? getThemeClass('bg-tech-cyan hover:bg-tech-lightcyan text-black', 'bg-blue-600 hover:bg-blue-700 text-white')
                            : getThemeClass(
                                'border-glass-border hover:bg-glass/40 text-foreground',
                                'border-gray-300 hover:bg-gray-50 text-gray-800'
                              )}
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
                          <span className="text-sm">{article.author.followers_count} 关注者</span>
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2 text-tech-cyan" />
                          <span className="text-sm">活跃作者</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
                {/* 评论区域 */}
                <GlassCard className={`p-6 ${cardBgClass}`}>
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
                      className={`w-full px-4 py-3 rounded-lg border ${
                        getThemeClass(
                          'bg-glass/20 border-glass-border text-foreground placeholder:text-foreground/50',
                          'bg-white/80 border-gray-300 text-gray-800 placeholder:text-gray-500'
                        )
                      } focus:outline-none focus:ring-2 focus:ring-tech-cyan disabled:opacity-50`}
                    ></textarea>
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
              </>
            ) : null}
          </div>
          {/* 侧边栏 */}
          <div className="lg:w-1/3 space-y-8">
            {/* 目录 */}
            {toc.length > 0 && (
              <GlassCard className={`p-6 sticky top-8 ${cardBgClass}`}>
                <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>目录</h3>
                <div className="space-y-2">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block py-1.5 px-3 rounded-md text-sm transition-colors ${
                        activeHeading === item.id
                          ? getThemeClass('bg-tech-cyan/20 text-tech-cyan font-medium', 'bg-blue-100 text-blue-800 font-medium')
                          : getThemeClass('text-foreground/70 hover:text-tech-cyan', 'text-gray-600 hover:text-blue-600')
                      }`}
                      style={{ marginLeft: `${(item.level - 1) * 10}px` }}
                    >
                      {item.text}
                    </a>
                  ))}
                </div>
              </GlassCard>
            )}
            {/* 文章统计 */}
            <GlassCard className={`p-6 ${cardBgClass}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>文章统计</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className={`text-sm ${mutedTextClass}`}>阅读进度</span>
                    <span className={`text-sm ${mutedTextClass}`}>{readingProgress}%</span>
                  </div>
                  <Progress value={readingProgress} className="w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-3 rounded-lg ${getThemeClass('bg-glass/20', 'bg-gray-100')}`}>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-2 text-tech-cyan" />
                      <span className="text-sm">{article?.view_count}</span>
                    </div>
                    <p className={`text-xs mt-1 ${mutedTextClass}`}>阅读量</p>
                  </div>
                  <div className={`p-3 rounded-lg ${getThemeClass('bg-glass/20', 'bg-gray-100')}`}>
                    <div className="flex items-center">
                      <ThumbsUp className="h-4 w-4 mr-2 text-tech-cyan" />
                      <span className="text-sm">{article?.likes_count}</span>
                    </div>
                    <p className={`text-xs mt-1 ${mutedTextClass}`}>点赞数</p>
                  </div>
                  <div className={`p-3 rounded-lg ${getThemeClass('bg-glass/20', 'bg-gray-100')}`}>
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-tech-cyan" />
                      <span className="text-sm">{article?.comments_count}</span>
                    </div>
                    <p className={`text-xs mt-1 ${mutedTextClass}`}>评论数</p>
                  </div>
                  <div className={`p-3 rounded-lg ${getThemeClass('bg-glass/20', 'bg-gray-100')}`}>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-tech-cyan" />
                      <span className="text-sm">{article?.read_time} 分钟</span>
                    </div>
                    <p className={`text-xs mt-1 ${mutedTextClass}`}>阅读时间</p>
                  </div>
                </div>
              </div>
            </GlassCard>
            {/* 相关文章 */}
            {relatedArticles.length > 0 && (
              <GlassCard className={`p-6 ${cardBgClass}`}>
                <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>相关文章</h3>
                <div className="space-y-4">
                  {relatedArticles.map((relatedArticle) => {
                    const articleForCard = convertToArticle(relatedArticle);
                    return (
                      <Link key={relatedArticle.id} href={`/articles/${relatedArticle.id}`}>
                        <div className={`p-3 rounded-lg transition-colors hover:scale-[1.02] ${getThemeClass('bg-glass/20 hover:bg-glass/30', 'bg-gray-100 hover:bg-gray-200')}`}>
                          <h4 className={`font-medium line-clamp-2 ${textClass}`}>{relatedArticle.title}</h4>
                          <div className="flex items-center text-xs mt-2 text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{articleForCard.read_time} 分钟阅读</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </GlassCard>
            )}
            {/* 作者其他文章 */}
            <GlassCard className={`p-6 ${cardBgClass}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>作者其他文章</h3>
              <div className="space-y-4">
                {/* 硬编码占位符列表：顺序固定，使用 index 作为 key */}
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Link key={idx} href="#">
                    <div className={`p-3 rounded-lg transition-colors hover:scale-[1.02] ${getThemeClass('bg-glass/20 hover:bg-glass/30', 'bg-gray-100 hover:bg-gray-200')}`}>
                      <h4 className={`font-medium ${textClass}`}>文章标题 {idx + 1}</h4>
                      <div className="flex items-center text-xs mt-2 text-muted-foreground">
                        <Eye className="h-3 w-3 mr-1" />
                        <span>1.2k 阅读</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
