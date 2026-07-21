"""Agent 内置站内工具。

约束：
- 只用 ilike / count 等 SQLite 兼容查询（测试库是 SQLite 内存库）；
- 禁止使用 search_articles_fulltext（依赖 PostgreSQL tsvector）；
- 返回给模型的文本要做长度截断，防止撑爆上下文。
"""

from sqlalchemy.orm import Session

from app.agent.tools.registry import AgentTool, ToolRegistry
from app.crud import article as article_crud
from app.models import Article, Comment, FriendLink, Message

# 单条工具结果的最大长度，超出截断（保护上下文窗口）
MAX_DETAIL_CHARS = 2000


def search_articles(db: Session, query: str, limit: int = 5) -> str:
    """按关键词搜索站内已发布文章（标题/摘要/正文 ilike 匹配）。"""
    try:
        limit = int(limit)
    except (TypeError, ValueError):
        limit = 5  # 模型幻觉出非法 limit 时落回默认值
    limit = max(1, min(limit, 10))
    articles = article_crud.get_articles(
        db, skip=0, limit=limit, published_only=True, search=query, with_relationships=False,
    )
    if not articles:
        return f"未找到与「{query}」相关的已发布文章。"
    lines = []
    for a in articles:
        line = f"- 《{a.title}》(slug: {a.slug}，浏览 {a.view_count or 0} 次)"
        if a.excerpt:
            line += f"：{a.excerpt}"
        lines.append(line)
    return "找到以下已发布文章：\n" + "\n".join(lines)


def get_article_detail(db: Session, slug: str) -> str:
    """按 slug 获取一篇已发布文章的详情（含截断后的正文）。"""
    article = article_crud.get_article_by_slug(db, slug)
    if article is None or not article.is_published:
        return f"未找到 slug 为「{slug}」的已发布文章。"
    content = (article.content or "")[:MAX_DETAIL_CHARS]
    return (
        f"《{article.title}》(slug: {article.slug})\n"
        f"摘要：{article.excerpt or '无'}\n"
        f"发布时间：{article.published_at or '未知'}\n"
        f"浏览量：{article.view_count or 0}\n"
        f"正文：{content}"
    )


def get_site_stats(db: Session) -> str:
    """获取站点内容统计（已发布文章数、评论数、留言数、友链数）。"""
    articles = db.query(Article).filter(Article.is_published == True).count()  # noqa: E712
    comments = db.query(Comment).count()
    messages = db.query(Message).count()
    friend_links = db.query(FriendLink).count()
    return (
        f"站点统计：已发布文章 {articles} 篇，评论 {comments} 条，"
        f"留言 {messages} 条，友链 {friend_links} 个。"
    )


def register_builtin_tools(registry: ToolRegistry) -> ToolRegistry:
    """把全部内置工具注册到注册表。"""
    registry.register(AgentTool(
        name="search_articles",
        description="搜索站内已发布的博客文章，按关键词匹配标题、摘要和正文，返回文章列表（含 slug）。当用户询问博主写过什么、找某主题文章时使用。",
        parameters={
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "搜索关键词"},
                "limit": {"type": "integer", "description": "最多返回几篇，默认 5，上限 10", "default": 5},
            },
            "required": ["query"],
        },
        func=search_articles,
    ))
    registry.register(AgentTool(
        name="get_article_detail",
        description="按 slug 获取一篇已发布文章的详细内容（标题、摘要、正文）。需要引用或总结某篇具体文章时使用，slug 可通过 search_articles 获得。",
        parameters={
            "type": "object",
            "properties": {
                "slug": {"type": "string", "description": "文章的 slug"},
            },
            "required": ["slug"],
        },
        func=get_article_detail,
    ))
    registry.register(AgentTool(
        name="get_site_stats",
        description="获取站点内容统计：已发布文章数、评论数、留言数、友链数。用户问站点规模/内容数量时使用。",
        parameters={"type": "object", "properties": {}},
        func=get_site_stats,
    ))
    return registry
