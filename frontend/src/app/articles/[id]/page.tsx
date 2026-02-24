'use client';

import { useState, useEffect, useRef } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Calendar, Tag, User, Eye, MessageCircle, Share2, Bookmark, Heart, ArrowLeft, Clock, ThumbsUp, MessageSquare, TrendingUp, Award, Users } from 'lucide-react';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import { useCodeBlockEnhancement } from '@/hooks/useCodeBlockEnhancement';
import { getArticleById, getRelatedArticles } from '@/services/articleService';
import type { RelatedArticle, Article } from '@/types';
import { useLoading } from '@/context/loading-context';
import PostCard from '@/components/ui/PostCard';
import { Progress } from '@/components/ui/progress';
import MediaPlayer from '@/components/ui/MediaPlayer';
import ReadingProgressBar from '@/components/articles/ReadingProgressBar';
import CommentTree from '@/components/articles/CommentTree';
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

// 示例评论数据
const sampleComments: Comment[] = [
  {
    id: '1',
    content: '这篇文章写得太好了！对我帮助很大，特别是关于性能优化的部分。',
    author: {
      id: 'user1',
      username: '张三',
    },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    likes: 24,
    replies: [
      {
        id: '1-1',
        content: '确实，我也学到了很多。作者的分享非常有价值！',
        author: {
          id: 'user2',
          username: '李四',
        },
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        likes: 8,
      },
      {
        id: '1-2',
        content: '希望能有更多这样的高质量文章！',
        author: {
          id: 'user3',
          username: '王五',
        },
        createdAt: new Date(Date.now() - 3600000 * 0.5).toISOString(),
        likes: 5,
      },
    ],
  },
  {
    id: '2',
    content: '请问作者，这个方案在生产环境中有实际应用吗？效果如何？',
    author: {
      id: 'user4',
      username: '赵六',
    },
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    likes: 12,
    replies: [],
  },
  {
    id: '3',
    content: '代码示例非常清晰，注释也很详细。点赞！',
    author: {
      id: 'user5',
      username: '孙七',
    },
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    likes: 18,
    replies: [
      {
        id: '3-1',
        content: '同感，这种风格的文章我很喜欢。',
        author: {
          id: 'user6',
          username: '周八',
        },
        createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
        likes: 3,
        replies: [
          {
            id: '3-1-1',
            content: '期待作者继续分享！',
            author: {
              id: 'user7',
              username: '吴九',
            },
            createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
            likes: 2,
          },
        ],
      },
    ],
  },
];

export default function ArticleDetailPage() {
  const params = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeHeading, setActiveHeading] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const tocRef = useRef<HTMLDivElement>(null);
  const { themedClasses, getThemeClass } = useThemedClasses();
  const { showLoading, hideLoading } = useLoading();

  useCodeBlockEnhancement(contentRef);

  useEffect(() => {
    const fetchArticleData = async () => {
      try {
        showLoading();
        setLoading(true);
        const articleData = await getArticleById(params.id);
        if (!articleData) {
          notFound();
        }
        setArticle(articleData);

        // 获取相关文章
        const relatedData = await getRelatedArticles(params.id);
        setRelatedArticles(relatedData);

        // 生成目录
        generateTableOfContents(articleData.content);

        // 设置示例评论
        setComments(sampleComments);
      } catch (err) {
        console.error('获取文章数据失败:', err);
        setError('获取文章数据失败');
      } finally {
        hideLoading();
        setLoading(false);
      }
    };

    if (params.id) {
      fetchArticleData();
    }
  }, [params.id]);

  // 生成目录
  const generateTableOfContents = (content: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

    const tocItems = Array.from(headings).map(heading => {
      return {
        id: heading.id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName.charAt(1))
      };
    });

    setToc(tocItems);
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

                  <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${textClass}`}>
                    {article.title}
                  </h1>

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
                      <Button variant="outline" size="sm" className={getThemeClass(
                        'border-glass-border hover:bg-glass/40 text-foreground',
                        'border-gray-300 hover:bg-gray-50 text-gray-800'
                      )}>
                        <Share2 className="h-4 w-4 mr-2" />
                        分享
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 文章内容 */}
                <GlassCard ref={contentRef} className={`mb-8 p-6 md:p-8 ${cardBgClass}`}>
                  <div className={`prose max-w-none ${getThemeClass('prose-invert', '')} ${textClass}`}>
                    <div dangerouslySetInnerHTML={{ __html: article.content }} />
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
                    <h3 className={`text-xl font-semibold ${textClass}`}>评论 ({comments.length})</h3>
                    <Button variant="outline" size="sm" className={getThemeClass(
                      'border-glass-border hover:bg-glass/40 text-foreground',
                      'border-gray-300 hover:bg-gray-50 text-gray-800'
                    )}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      写评论
                    </Button>
                  </div>

                  <CommentTree
                    comments={comments}
                    onReply={(commentId) => console.log('回复评论:', commentId)}
                    onLike={(commentId) => console.log('点赞评论:', commentId)}
                  />

                  <div className="pt-6 mt-6 border-t border-dashed border-opacity-30">
                    <textarea
                      rows={4}
                      placeholder="写下你的评论..."
                      className={`w-full px-4 py-3 rounded-lg border ${
                        getThemeClass(
                          'bg-glass/20 border-glass-border text-foreground placeholder:text-foreground/50',
                          'bg-white/80 border-gray-300 text-gray-800 placeholder:text-gray-500'
                        )
                      } focus:outline-none focus:ring-2 focus:ring-tech-cyan`}
                    ></textarea>
                    <div className="mt-4 flex justify-end">
                      <Button>发表评论</Button>
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