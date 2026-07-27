"""写作会话服务层：阶段机 + 有界上下文消息。

职责：
1. 强制推进合法阶段（clarifying → outline_review → drafting → draft_review → editing），
   非法跳转抛 ConflictException（API 端点将其映射为 409）。
2. 维护有界消息历史（最近 20 条）、组装给 LLM 的上下文消息、计算内容指纹。

约定：本服务抛出的 ValueError 由 API 端点捕获并转为 HTTP 400。
"""

import hashlib
import json
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.crud.writing_session import save_writing_session
from app.exceptions import ConflictException
from app.models.writing_session import WritingSession


# 每个动作允许的前置 stage 集合：只有处于其中之一才能执行该动作。
# store_outline 允许 clarifying（首次生成）和 outline_review（重新生成/覆盖）。
TRANSITIONS = {
    "store_outline": {"clarifying", "outline_review"},
    "begin_drafting": {"outline_review"},
    "store_draft": {"drafting", "draft_review"},
    "confirm_draft": {"draft_review"},
}


class WritingSessionService:
    @staticmethod
    def _require_stage(session: WritingSession, action: str) -> None:
        if session.stage not in TRANSITIONS[action]:
            raise ConflictException(
                message=(
                    f"非法阶段跳转：当前 stage='{session.stage}'，"
                    f"不允许执行动作'{action}'（允许的前置 stage："
                    f"{sorted(TRANSITIONS[action])}）"
                ),
            )

    def store_outline(self, db: Session, session: WritingSession, outline: str) -> WritingSession:
        self._require_stage(session, "store_outline")
        if not outline.strip():
            raise ValueError("大纲不能为空")
        session.outline = outline.strip()
        session.stage = "outline_review"
        return save_writing_session(db, session)

    def begin_drafting(self, db: Session, session: WritingSession) -> WritingSession:
        self._require_stage(session, "begin_drafting")
        if not session.outline.strip():
            raise ValueError("确认大纲前必须先生成大纲")
        session.stage = "drafting"
        return save_writing_session(db, session)

    def store_draft(self, db: Session, session: WritingSession, draft: str) -> WritingSession:
        self._require_stage(session, "store_draft")
        if not draft.strip():
            raise ValueError("初稿不能为空")
        session.draft = draft.strip()
        session.stage = "draft_review"
        return save_writing_session(db, session)

    def confirm_draft(self, db: Session, session: WritingSession) -> WritingSession:
        self._require_stage(session, "confirm_draft")
        if not session.draft.strip():
            raise ValueError("确认初稿前必须先生成初稿")
        session.stage = "editing"
        return save_writing_session(db, session)

    # ── 有界上下文辅助 ─────────────────────────────────────────────

    @staticmethod
    def append_message(session: WritingSession, role: str, content: str) -> None:
        """向消息历史追加一条记录，并裁剪到最近 20 条（有界上下文，控制 token 与存储）。"""
        messages = list(session.messages or [])
        messages.append({
            "id": str(uuid.uuid4()),
            "role": role,
            "content": content,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        session.messages = messages[-20:]

    @staticmethod
    def context_messages(session: WritingSession) -> list[dict[str, str]]:
        """组装给 LLM 的上下文消息：已确认需求摘要 + 最近 10 条历史 + 当前大纲。"""
        summary = json.dumps(session.requirements_summary or {}, ensure_ascii=False)
        result = [{"role": "system", "content": f"已确认需求：{summary}"}]
        result.extend({"role": m["role"], "content": m["content"]} for m in (session.messages or [])[-10:])
        if session.outline:
            result.append({"role": "system", "content": f"当前大纲：\n{session.outline}"})
        return result

    @staticmethod
    def content_hash(content: str) -> str:
        """计算内容指纹（SHA-256），用于去重与变更检测。"""
        return hashlib.sha256(content.encode("utf-8")).hexdigest()
