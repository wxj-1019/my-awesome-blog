import { getArticles } from '@/services/articleService';
import { env } from '@/lib/env';

export async function GET() {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  let articles: Awaited<ReturnType<typeof getArticles>> = [];
  try {
    articles = await getArticles({ limit: 50 });
  } catch {
    // 如果获取失败，返回空 RSS，避免 500 错误
    articles = [];
  }

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>My Awesome Blog</title>
    <link>${baseUrl}</link>
    <description>一个现代的企业级个人博客，分享 Web 开发、设计与技术内容。</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${articles
      .map(
        (article) => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${baseUrl}/articles/${article.id}</link>
      <guid>${baseUrl}/articles/${article.id}</guid>
      <pubDate>${new Date(article.published_at || article.created_at).toUTCString()}</pubDate>
      <description><![CDATA[${article.excerpt || article.content.substring(0, 200)}...]]></description>
      <author>${article.author.email || article.author.username}</author>
    </item>`
      )
      .join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
