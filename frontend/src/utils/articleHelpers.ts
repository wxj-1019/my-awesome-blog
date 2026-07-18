import type { Article, Album } from '@/types';

export const mapArticlesToAlbums = (articles: Article[]): Album[] => {
  return articles.map(article => ({
    id: article.id,
    title: article.title,
    coverImage: article.cover_image || '/assets/placeholder.svg',
    description: article.excerpt,
    date: article.published_at,
    featured: true,
    images: 0,
    slug: article.id
  }));
};

export const getHotArticles = (articles: Article[], limit: number = 10): Article[] => {
  return [...articles]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, limit);
};

export const groupArticlesByMonth = (articles: Article[]): Record<string, Article[]> => {
  return articles.reduce((acc, article) => {
    const month = new Date(article.published_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
    if (!acc[month]) {acc[month] = [];}
    acc[month].push(article);
    return acc;
  }, {} as Record<string, Article[]>);
};

export const getTotalArticleCount = (categories: Array<{ article_count: number }>): number => {
  return categories.reduce((sum, c) => sum + c.article_count, 0);
};
