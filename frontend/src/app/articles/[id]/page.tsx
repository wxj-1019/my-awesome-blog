import { cache } from 'react';
import type { Metadata } from 'next';
import { getArticleById } from '@/services/articleService';
import { env } from '@/lib/env';
import ArticleDetailPageContent from './article-detail-content';

/** 请求级缓存，避免 generateMetadata 和 Page 重复请求同一篇文章 */
const getCachedArticle = cache(async (id: string) => {
  return getArticleById(id);
});

type PageProps = {
  /** Next.js 15+：params 为 Promise */
  params: Promise<{ id: string }> | { id: string };
};

async function resolveId(
  params: PageProps['params']
): Promise<string | undefined> {
  const resolved = await Promise.resolve(params);
  return resolved?.id;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const id = await resolveId(params);
  if (!id) {
    return { title: '文章未找到 - My Awesome Blog' };
  }
  const article = await getCachedArticle(id);

  if (!article) {
    return {
      title: '文章未找到 - My Awesome Blog',
    };
  }

  const description =
    article.excerpt ||
    `阅读 ${article.title}，作者 ${article.author.username}，预计阅读时间 ${article.read_time} 分钟。`;
  const url = `${env.NEXT_PUBLIC_SITE_URL}/articles/${article.id}`;
  const images = article.cover_image ? [article.cover_image] : undefined;

  return {
    title: `${article.title} - My Awesome Blog`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      url,
      images,
      publishedTime: article.published_at,
      modifiedTime: article.updated_at,
      authors: [article.author.username],
      tags: article.tags.map((tag) => tag.name),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images,
    },
  };
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const id = await resolveId(params);
  const article = id ? await getCachedArticle(id) : null;
  const jsonLd = article
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.title,
        description: article.excerpt || undefined,
        image: article.cover_image || undefined,
        datePublished: article.published_at,
        dateModified: article.updated_at,
        mainEntityOfPage: `${env.NEXT_PUBLIC_SITE_URL}/articles/${article.id}`,
        author: {
          '@type': 'Person',
          name: article.author.username,
        },
        publisher: {
          '@type': 'Organization',
          name: 'My Awesome Blog',
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
      )}
      <ArticleDetailPageContent prefetchedArticle={article} />
    </>
  );
}
