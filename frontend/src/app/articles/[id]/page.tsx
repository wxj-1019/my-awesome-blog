import { cache } from 'react';
import type { Metadata } from 'next';
import { getArticleById } from '@/services/articleService';
import ArticleDetailPageContent from './article-detail-content';

/** 请求级缓存，避免 generateMetadata 和 Page 重复请求同一篇文章 */
const getCachedArticle = cache(async (id: string) => {
  return getArticleById(id);
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const article = await getCachedArticle(params.id);

  if (!article) {
    return {
      title: '文章未找到 - My Awesome Blog',
    };
  }

  return {
    title: `${article.title} - My Awesome Blog`,
    description: article.excerpt || `阅读 ${article.title}，作者 ${article.author.username}，预计阅读时间 ${article.read_time} 分钟。`,
    openGraph: {
      title: article.title,
      description: article.excerpt || `阅读 ${article.title}`,
      type: 'article',
      publishedTime: article.published_at,
      authors: [article.author.username],
    },
  };
}

export default async function ArticleDetailPage({ params }: { params: { id: string } }) {
  // 复用 generateMetadata 中的缓存结果，不再重复请求
  const article = await getCachedArticle(params.id);

  return <ArticleDetailPageContent prefetchedArticle={article} />;
}
