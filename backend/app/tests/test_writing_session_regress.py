"""写作会话阶段机回退边（graph loop 循环边）测试。"""
import uuid

import pytest
from fastapi import status

from app.models.user import User


def _create_session(client, test_session, stage=None):
    """创建写作会话（认证已在 conftest 全局绕过）。"""
    resp = client.post("/api/v1/agent/writing-sessions/", json={})
    assert resp.status_code == status.HTTP_201_CREATED, resp.text
    session_id = resp.json()["id"]
    if stage and stage != "clarifying":
        # 直接改 DB 层 stage，跳过逐阶段推进（回退边测试只关心回退本身）
        from app.crud.writing_session import get_writing_session_for_user
        from app.crud.writing_session import save_writing_session
        from app.models.user import User as UserModel
        user = test_session.query(UserModel).first()
        session = get_writing_session_for_user(test_session, uuid.UUID(session_id), user.id)
        session.stage = stage
        save_writing_session(test_session, session)
    return session_id


def test_regress_draft_review_to_outline(client, test_session):
    """draft_review → outline_review 合法回退。"""
    sid = _create_session(client, test_session, stage="draft_review")
    resp = client.post(
        f"/api/v1/agent/writing-sessions/{sid}/regress",
        json={"target_stage": "outline_review"},
    )
    assert resp.status_code == status.HTTP_200_OK, resp.text
    assert resp.json()["stage"] == "outline_review"


def test_regress_outline_review_to_clarifying(client, test_session):
    """outline_review → clarifying 合法回退。"""
    sid = _create_session(client, test_session, stage="outline_review")
    resp = client.post(
        f"/api/v1/agent/writing-sessions/{sid}/regress",
        json={"target_stage": "clarifying"},
    )
    assert resp.status_code == status.HTTP_200_OK, resp.text
    assert resp.json()["stage"] == "clarifying"


def test_regress_drafting_to_outline(client, test_session):
    """drafting → outline_review 合法回退（流中断恢复）。"""
    sid = _create_session(client, test_session, stage="drafting")
    resp = client.post(
        f"/api/v1/agent/writing-sessions/{sid}/regress",
        json={"target_stage": "outline_review"},
    )
    assert resp.status_code == status.HTTP_200_OK, resp.text
    assert resp.json()["stage"] == "outline_review"


def test_regress_illegal_targets(client, test_session):
    """非法回退边一律 409：非邻接目标、无回退边的阶段。"""
    sid = _create_session(client, test_session, stage="draft_review")
    # draft_review 不能直接回 clarifying（必须经 outline_review）
    resp = client.post(
        f"/api/v1/agent/writing-sessions/{sid}/regress",
        json={"target_stage": "clarifying"},
    )
    assert resp.status_code == status.HTTP_409_CONFLICT, resp.text

    # clarifying 是回退的终点，不能再回退
    sid2 = _create_session(client, test_session, stage="clarifying")
    resp = client.post(
        f"/api/v1/agent/writing-sessions/{sid2}/regress",
        json={"target_stage": "outline_review"},
    )
    assert resp.status_code == status.HTTP_409_CONFLICT, resp.text

    # editing 阶段没有回退边（Phase 2 用 confirm 完成而非回退）
    sid3 = _create_session(client, test_session, stage="editing")
    resp = client.post(
        f"/api/v1/agent/writing-sessions/{sid3}/regress",
        json={"target_stage": "outline_review"},
    )
    assert resp.status_code == status.HTTP_409_CONFLICT, resp.text


def test_regress_keeps_downstream_data(client, test_session):
    """回退保留下游数据（draft/outline 不删除，重生成时覆盖）。"""
    sid = _create_session(client, test_session, stage="draft_review")
    # 注入下游数据
    from app.crud.writing_session import get_writing_session_for_user, save_writing_session
    from app.models.user import User as UserModel
    user = test_session.query(UserModel).first()
    session = get_writing_session_for_user(test_session, uuid.UUID(sid), user.id)
    session.draft = "旧初稿内容"
    session.outline = "旧大纲内容"
    save_writing_session(test_session, session)

    resp = client.post(
        f"/api/v1/agent/writing-sessions/{sid}/regress",
        json={"target_stage": "outline_review"},
    )
    assert resp.status_code == status.HTTP_200_OK, resp.text
    body = resp.json()
    assert body["stage"] == "outline_review"
    assert body["draft"] == "旧初稿内容"  # 保留不删除
    assert body["outline"] == "旧大纲内容"
