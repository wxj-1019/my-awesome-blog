'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

import { Download, FileVideo, FileAudio, FileImage, FileText } from 'lucide-react';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import { useCodeBlockEnhancement } from '@/hooks/useCodeBlockEnhancement';
import { getRelatedArticles } from '@/services/articleService';
import { getCommentTree, createComment } from '@/services/commentService';
import { TOKEN_KEY } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import logger from '@/utils/logger';
import type { RelatedArticle, Article } from '@/types';
import ReadingProgressBar from '@/components/articles/ReadingProgressBar';
import ArticleHeroStage from '@/components/articles/ArticleHeroStage';
import ArticleHeroCover from '@/components/articles/ArticleHeroCover';
import ArticleTocRail from '@/components/articles/ArticleTocRail';
import RelatedArticleRail from '@/components/articles/RelatedArticleRail';
import ArticleReadingMetaBar from '@/components/articles/ArticleReadingMetaBar';
import ArticleAuthorPanel from '@/components/articles/ArticleAuthorPanel';
import ArticleBodyReveal from '@/components/articles/ArticleBodyReveal';
import ReadingSettingsPanel, {
  FONT_SIZE_CSS,
  LINE_HEIGHT_CSS,
  LETTER_SPACING_CSS,
} from '@/components/articles/ReadingSettingsPanel';
import CommentTree from '@/components/articles/CommentTree';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { extractMarkdownHeadings } from '@/utils/markdown-headings';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useActiveHeading } from '@/hooks/useActiveHeading';
import {
  DEFAULT_READING_SETTINGS,
  loadReadingSettings,
  saveReadingSettings,
  type ReadingSettings,
} from '@/lib/reading-settings';

import { Comment } from '@/types';
/** 附件大小格式化（详情页渲染用） */
function formatFileSize(bytes: number): string {
  if (bytes <= 0) {return '0 Bytes';}
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

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
  /** 服务端 RSC 预取的文章数据（page 层对不存在的文章直接 notFound，必然非空） */
  prefetchedArticle: Article;
}

export default function ArticleDetailPageContent({
  prefetchedArticle,
}: ArticleDetailPageContentProps) {
  const params = useParams<{ id: string }>();
  const article = prefetchedArticle;
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
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
  // 阅读设置：默认值与现网一致，挂载后读 localStorage（避免 SSR hydration 不一致）
  const [readingSettings, setReadingSettings] = useState<ReadingSettings>(DEFAULT_READING_SETTINGS);
  const contentRef = useRef<HTMLDivElement>(null);
  const { themedClasses } = useThemedClasses();
  useCodeBlockEnhancement(contentRef);
  const readingProgress = useReadingProgress(contentRef);
  const activeHeading = useActiveHeading(toc);

  // 挂载后同步登录态（客户端才可访问 localStorage）
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem(TOKEN_KEY));
  }, []);

  // 挂载后恢复用户保存的阅读设置
  useEffect(() => {
    setReadingSettings(loadReadingSettings());
  }, []);

  const handleReadingSettingsChange = (next: ReadingSettings) => {
    setReadingSettings(next);
    saveReadingSettings(next);
  };

  // 文章由 RSC 预取，客户端仅需加载相关文章
  useEffect(() => {
    generateTableOfContents(article.content);
    getRelatedArticles(params.id)
      .then(setRelatedArticles)
      .catch(() => {});
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
  const mutedTextClass = themedClasses.mutedTextClass;
  // 侧轨显隐：目录仅有文章主标题（无小节）时无导航价值，隐藏左轨；
  // 无相关文章时隐藏右轨——空侧轨会挤占左侧空间使正文显得靠左
  const showTocRail = toc.length > 1;
  const showRelatedRail = relatedArticles.length > 0;
  // 阅读设置面板挂载位置：优先左轨（目录下方），其次右轨（相关文章下方），
  // 两侧都无时放正文顶部
  const settingsPanelAt: 'left' | 'right' | 'top' = showTocRail
    ? 'left'
    : showRelatedRail
      ? 'right'
      : 'top';
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
        {article ? (
          <>
            <ArticleHeroStage
              article={article}
              isLiked={isLiked}
              isBookmarked={isBookmarked}
              onLike={handleLike}
              onBookmark={handleBookmark}
              formatDate={formatDate}
              textClass={textClass}
              contentClassName="max-w-[50rem] px-4 md:px-6"
              mediaSlot={
                /* 封面图 + Ken Burns 缓推，替代原视频（视频比例与容器冲突占不满） */
                <ArticleHeroCover
                  src={article.cover_image || '/covers/default-cover.svg'}
                  alt={article.title}
                />
              }
            />
            {/* xl+ 三栏阅读布局：左目录 | 正文 | 相关文章。
                目录只有文章主标题（无二级小节）或没有相关文章时隐藏对应侧轨，
                动态列数让正文在页面居中，避免空侧轨挤占左侧空间使正文显得靠左 */}
            <div className={cn(
              'relative grid grid-cols-1 gap-6 px-4 md:px-6 xl:items-start xl:justify-center 2xl:gap-8',
              showTocRail && showRelatedRail && 'xl:grid-cols-[13rem_minmax(0,1fr)_14rem] 2xl:grid-cols-[14rem_minmax(0,50rem)_16rem]',
              showTocRail && !showRelatedRail && 'xl:grid-cols-[13rem_minmax(0,1fr)] 2xl:grid-cols-[14rem_minmax(0,50rem)]',
              !showTocRail && showRelatedRail && 'xl:grid-cols-[minmax(0,1fr)_14rem] 2xl:grid-cols-[minmax(0,50rem)_16rem]'
            )}>
              {showTocRail && (
                <aside
                  className="hidden xl:block xl:sticky xl:top-24 xl:self-start"
                  aria-label="文章目录"
                >
                  <div className="flex flex-col gap-6">
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
                    {settingsPanelAt === 'left' && (
                      <ReadingSettingsPanel
                        settings={readingSettings}
                        onChange={handleReadingSettingsChange}
                        cardBgClass={cardBgClass}
                        textClass={textClass}
                        mutedTextClass={mutedTextClass}
                      />
                    )}
                  </div>
                </aside>
              )}
              <div className="min-w-0 w-full max-w-[50rem] justify-self-center">
                {/* 阅读设置：两侧都无侧栏时放正文顶部（全断点）；
                    有侧栏时（left/right）移动端侧栏隐藏，正文顶部加副本入口 */}
                {settingsPanelAt === 'top' && (
                  <ReadingSettingsPanel
                    settings={readingSettings}
                    onChange={handleReadingSettingsChange}
                    cardBgClass={cardBgClass}
                    textClass={textClass}
                    mutedTextClass={mutedTextClass}
                    className="mb-8"
                  />
                )}
                {settingsPanelAt !== 'top' && (
                  <ReadingSettingsPanel
                    settings={readingSettings}
                    onChange={handleReadingSettingsChange}
                    cardBgClass={cardBgClass}
                    textClass={textClass}
                    mutedTextClass={mutedTextClass}
                    className="mb-8 xl:hidden"
                  />
                )}
                {/* padding=none 避免与默认 md 内边距叠加；ref 绑在正文根。
                    阅读设置以 inline style 覆盖 .article-reading-surface 的
                    硬编码字号/行高/字距（inline 优先级最高） */}
                <GlassCard
                  padding="none"
                  className={`mb-8 p-6 md:p-8 ${cardBgClass}`}
                >
                  <div
                    ref={contentRef}
                    className="article-reading-surface"
                    style={{
                      fontSize: FONT_SIZE_CSS[readingSettings.fontSize],
                      lineHeight: LINE_HEIGHT_CSS[readingSettings.lineHeight],
                      letterSpacing: LETTER_SPACING_CSS[readingSettings.letterSpacing],
                    }}
                  >
                    <ArticleBodyReveal enabled>
                      <div
                        className={`prose prose-base md:prose-lg max-w-none dark:prose-invert leading-relaxed md:leading-[1.8] ${readingSettings.fontFamily === 'serif' ? 'font-serif' : 'font-sans'} ${textClass}`}
                      >
                        <MarkdownRenderer content={article.content} context="article" />
                      </div>
                    </ArticleBodyReveal>
                  </div>
                </GlassCard>

                <ArticleReadingMetaBar article={article} className="mb-8" />
                <ArticleAuthorPanel
                  author={article.author}
                  isFollowing={isFollowingAuthor}
                  onFollow={handleFollowAuthor}
                  className="mb-8"
                />
                {/* 移动副本与桌面右轨通过 xl display 类互斥，任一断点只暴露一份内容。 */}
                {relatedArticles.length > 0 && (
                  <RelatedArticleRail
                    articles={relatedArticles}
                    heading="继续阅读"
                    className={cn('mb-8 xl:hidden', cardBgClass)}
                  />
                )}
                {/* 文章资料：读者可见的附件（is_reference=false），按类型渲染播放器/图片/下载链接 */}
                {article.attachments && article.attachments.filter((att) => !att.is_reference).length > 0 && (
                  <GlassCard padding="none" className={`mb-8 p-6 md:p-8 ${cardBgClass}`}>
                    <h3 className="text-lg font-semibold mb-4 text-white">文章资料</h3>
                    <div className="space-y-4">
                      {article.attachments
                        .filter((att) => !att.is_reference)
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((att) => {
                          const Icon =
                            att.media_type === 'video' ? FileVideo
                            : att.media_type === 'audio' ? FileAudio
                            : att.media_type === 'image' ? FileImage
                            : FileText;
                          return (
                            <div key={att.id} className="space-y-1.5">
                              {att.media_type === 'video' ? (
                                <video
                                  src={att.url}
                                  controls
                                  preload="metadata"
                                  className="w-full rounded-xl border border-white/10 bg-black"
                                />
                              ) : att.media_type === 'audio' ? (
                                <audio
                                  src={att.url}
                                  controls
                                  preload="metadata"
                                  className="w-full"
                                />
                              ) : att.media_type === 'image' ? (
                                // 附件图片 URL 由作者上传/填写，域名不可控，保留 <img>
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  loading="lazy"
                                  className="w-full rounded-xl border border-white/10"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                  <Icon className="h-5 w-5 text-tech-cyan shrink-0" />
                                  <span className="flex-1 min-w-0">
                                    <span className="block text-sm font-medium text-white truncate">{att.name}</span>
                                    {att.file_size ? (
                                      <span className="block text-xs text-muted-foreground">
                                        {formatFileSize(att.file_size)}
                                      </span>
                                    ) : null}
                                  </span>
                                  <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                                </a>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </GlassCard>
                )}
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
              {showRelatedRail && (
                <aside
                  className="hidden xl:block xl:sticky xl:top-24 xl:self-start"
                  aria-label="相关文章"
                >
                  <div className="flex flex-col gap-6">
                    <RelatedArticleRail
                      articles={relatedArticles}
                      className={cardBgClass}
                    />
                    {settingsPanelAt === 'right' && (
                      <ReadingSettingsPanel
                        settings={readingSettings}
                        onChange={handleReadingSettingsChange}
                        cardBgClass={cardBgClass}
                        textClass={textClass}
                        mutedTextClass={mutedTextClass}
                      />
                    )}
                  </div>
                </aside>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
