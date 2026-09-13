"""订阅者通知服务：文章发布后向活跃订阅者逐个发送通知邮件。

分层说明：本服务负责「查订阅者 + 编排发送」，纯邮件模板/SMTP 细节在
email_service，数据查询复用 crud；端点只负责在发布翻转点调度本服务
（FastAPI BackgroundTasks），保持端点薄、crud 纯数据。
"""

import uuid
from typing import List

from app.core.config import settings
from app.core.database import SessionLocal
from app import crud
from app.services.email_service import email_service
from app.utils.logger import app_logger

# 单次批量查询上限（遵守全局铁律：批量单次 ≤ 100）
_SUBSCRIBER_BATCH_SIZE = 100


def _get_active_subscriber_emails(db) -> List[str]:
    """分页拉取全部活跃订阅者邮箱（单次查询 ≤ 100）。

    过渡决策：发送侧过滤条件仅用 is_active=True。
    is_verified 闭环（订阅验证邮件 + POST /verify）本轮才接线，
    历史订阅者大多 is_verified=False，若同时要求已验证会导致
    所有订阅者永远收不到通知；待验证流程沉淀一段时间后，
    应回收此处改回 crud.get_active_subscriptions（is_active + is_verified 双条件）。
    """
    emails: List[str] = []
    skip = 0
    while True:
        batch = crud.get_subscriptions(
            db,
            skip=skip,
            limit=_SUBSCRIBER_BATCH_SIZE,
            is_active=True,
            is_verified=None,  # None 表示不过滤验证状态（过渡决策见函数 docstring）
        )
        emails.extend(str(s.email) for s in batch)
        if len(batch) < _SUBSCRIBER_BATCH_SIZE:
            break
        skip += _SUBSCRIBER_BATCH_SIZE
    return emails


def notify_subscribers_of_new_article(article_id: str) -> int:
    """文章发布后台任务：向活跃订阅者逐个发送新文章通知。

    注意：必须自建 DB 会话——FastAPI 的依赖清理（get_db 关闭会话）
    发生在后台任务执行之前，不能复用请求级 Session。

    Args:
        article_id: 文章 ID（字符串形式，由端点传入）

    Returns:
        int: 成功发送的邮件数（单封失败仅记日志，不中断其余发送）
    """
    db = SessionLocal()
    try:
        article = crud.get_article(db, uuid.UUID(article_id))
        # 文章可能已被删除或又撤回草稿，此时不发送
        if not article or not article.is_published:
            return 0

        subscriber_emails = _get_active_subscriber_emails(db)
    finally:
        db.close()

    if not subscriber_emails:
        return 0

    # 前端文章详情路由为 /articles/[id]
    article_url = f"{settings.FRONTEND_URL}/articles/{article_id}"
    excerpt = (getattr(article, "excerpt", None) or "").strip()

    sent_count = 0
    for subscriber_email in subscriber_emails:
        try:
            if email_service.send_new_article_notification(
                [subscriber_email],
                article.title,
                article_url,
                excerpt,
            ):
                sent_count += 1
        except Exception as exc:  # 单封失败不影响其余订阅者
            app_logger.error(
                f"发送新文章通知失败: subscriber={subscriber_email}, "
                f"article_id={article_id}, error={exc}",
                exc_info=True,
            )

    app_logger.info(
        f"新文章通知发送完成: article_id={article_id}, "
        f"订阅者={len(subscriber_emails)}, 成功={sent_count}"
    )
    return sent_count
