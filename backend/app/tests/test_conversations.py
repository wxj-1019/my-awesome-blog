"""
对话接口测试。

重点覆盖列表接口的两个回归点：
1. 响应为统一分页信封 {items, total, skip, limit}
   —— 原先返回 {conversations, total, page, page_size}，与前端读取的 items 键错配，
      导致 admin 与 AI 聊天两处列表恒为空。
2. 列表不含 messages，且列表查询次数不随对话条数增长（N+1 回归）。
"""
import uuid

import pytest
from fastapi import status
from sqlalchemy import event

from app.models.conversation import Conversation, ConversationMessage
from app.models.user import User


@pytest.fixture
def seeded_conversations(test_session):
    """
    造 5 个对话，每个带 3 条消息。

    必须挂在 conftest 的 override_auth 所注入的那个用户名下——列表接口按
    current_user 的 tenant_id / user_id 过滤，换个用户会一条都查不到。
    """
    user = test_session.query(User).filter(User.username == "testadmin").first()
    assert user is not None, "override_auth fixture 应已创建 testadmin"

    for i in range(5):
        conv = Conversation(
            tenant_id=user.tenant_id,
            user_id=user.id,
            title=f"会话 {i}",
            model="deepseek-chat",
        )
        test_session.add(conv)
        test_session.commit()
        for j in range(3):
            test_session.add(
                ConversationMessage(
                    conversation_id=conv.id,
                    role="user" if j % 2 == 0 else "assistant",
                    content=f"消息 {i}-{j}",
                )
            )
        test_session.commit()

    return user


def test_list_conversations_returns_page_envelope(client, seeded_conversations):
    """列表应返回 {items, total, skip, limit}，且 total 为总条数。"""
    response = client.get("/api/v1/conversations/", params={"skip": 0, "limit": 2})
    assert response.status_code == status.HTTP_200_OK

    page = response.json()
    assert set(["items", "total", "skip", "limit"]).issubset(page.keys())
    assert len(page["items"]) == 2
    assert page["total"] >= 5
    assert page["skip"] == 0 and page["limit"] == 2

    # 旧键名不应再出现，避免调用方继续依赖
    assert "conversations" not in page


def test_list_conversations_omits_messages(client, seeded_conversations):
    """列表项不应带 messages 正文，但应保留 total_messages 计数。"""
    page = client.get("/api/v1/conversations/").json()
    assert page["items"], "应至少返回一条对话"

    for item in page["items"]:
        assert "messages" not in item, "列表不应内联消息正文"
        assert "total_messages" in item, "列表应保留消息计数字段"


def test_list_conversations_query_count_is_constant(client, test_session, seeded_conversations):
    """
    N+1 回归：列表查询次数不应随对话条数增长。

    原实现下列表 schema 内联 messages，序列化时逐条懒加载，
    N 条对话会产生 N 次额外查询。
    """
    engine = test_session.get_bind()
    counter = {"n": 0}

    def _count(conn, cursor, statement, params, context, executemany):
        if statement.lstrip().upper().startswith("SELECT"):
            counter["n"] += 1

    event.listen(engine, "before_cursor_execute", _count)
    try:
        counter["n"] = 0
        response = client.get("/api/v1/conversations/", params={"limit": 5})
        queries = counter["n"]
    finally:
        event.remove(engine, "before_cursor_execute", _count)

    returned = len(response.json()["items"])
    assert returned == 5, "fixture 应返回 5 条对话"

    # N+1 下取 5 条至少需要 1(列表) + 5(逐条 messages) + 1(计数) = 7 次 SELECT。
    # 正确实现只需「列表 + 计数」两次，这里留出余量但仍远低于条数。
    assert queries < returned, (
        f"返回 {returned} 条却发了 {queries} 次 SELECT，查询次数随条数增长，疑似 N+1"
    )
