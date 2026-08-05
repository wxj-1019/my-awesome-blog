from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, users, articles, comments, typewriter_contents,
    categories, tags, friend_links, portfolio, timeline_events,
    statistics, subscriptions, images, audit_logs, analytics, oss_upload,
    messages, albums, monitoring, llm, prompts, weather, conversations, memories,
    tenants, agent, writing_sessions, image_gen,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(articles.router, prefix="/articles", tags=["articles"])
api_router.include_router(comments.router, prefix="/comments", tags=["comments"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(tags.router, prefix="/tags", tags=["tags"])
api_router.include_router(friend_links.router, prefix="/friend-links", tags=["friend-links"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])
api_router.include_router(timeline_events.router, prefix="/timeline-events", tags=["timeline-events"])
api_router.include_router(statistics.router, prefix="/stats", tags=["statistics"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["subscriptions"])
api_router.include_router(images.router, prefix="/images", tags=["images"])
api_router.include_router(typewriter_contents.router, prefix="/typewriter-contents", tags=["typewriter-contents"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit-logs"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(oss_upload.router, prefix="/oss", tags=["oss-upload"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(albums.router, prefix="/albums", tags=["albums"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"])
api_router.include_router(llm.router, prefix="/llm", tags=["llm"])
api_router.include_router(agent.router, prefix="/agent", tags=["agent"])
api_router.include_router(
    writing_sessions.router,
    prefix="/agent/writing-sessions",
    tags=["agent-writing"],
)
api_router.include_router(prompts.router, prefix="/prompts", tags=["prompts"])
api_router.include_router(weather.router, prefix="/weather", tags=["weather"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(memories.router, prefix="/memories", tags=["memories"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(image_gen.router, prefix="/image-gen", tags=["image-gen"])
