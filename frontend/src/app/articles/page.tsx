import type { Metadata } from 'next';
import ArticlesPageClient, { type PrefetchedArticlesData } from './articles-content';
import {
  getArticles,
  getCategories,
  getTags,
} from '@/services/articleService';

export const metadata: Metadata = {
  title: '文章列表 - My Awesome Blog',
  description: '浏览博客全部文章，按分类、标签筛选，发现关于 Web 开发、设计与技术的优质内容。',
};

const ARTICLES_PER_PAGE = 12;

/** 服务端按 URL 筛选参数预取首屏数据；失败则回退客户端全流程拉取 */
async function prefetchArticlesData(
  category?: string,
  tag?: string,
  search?: string
): Promise<PrefetchedArticlesData | undefined> {
  try {
    const [articles, categories, tags] = await Promise.all([
      getArticles({
        category: category || undefined,
        tag: tag || undefined,
        search: search || undefined,
        limit: ARTICLES_PER_PAGE,
        offset: 0,
      }),
      getCategories(),
      getTags(),
    ]);
    return {
      articles,
      categories,
      tags,
      hasMore: articles.length >= ARTICLES_PER_PAGE,
      category: category ?? null,
      tag: tag ?? null,
      search: search ?? null,
    };
  } catch {
    return undefined;
  }
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string; search?: string }>;
}) {
  const params = await searchParams;
  const prefetched = await prefetchArticlesData(params.category, params.tag, params.search);
  return <ArticlesPageClient prefetched={prefetched} />;
}
