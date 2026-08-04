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
from typing import AsyncIterator

from sqlalchemy.orm import Session

from app.crud.writing_session import save_writing_session
from app.exceptions import ConflictException, NotFoundException
from app.models.writing_session import WritingSession
from app.services.agent_service import AgentService
from app.utils.json_utils import extract_first_json_object


# 每个动作允许的前置 stage 集合：只有处于其中之一才能执行该动作。
# store_outline 允许 clarifying（首次生成）和 outline_review（重新生成/覆盖）。
TRANSITIONS = {
    "store_outline": {"clarifying", "outline_review"},
    "begin_drafting": {"outline_review"},
    "store_draft": {"drafting", "draft_review"},
    "confirm_draft": {"draft_review"},
}


CLARIFICATION_PROMPT = """你是中文博客写作教练。根据已确认需求和最近对话，每次只问一个最关键的澄清问题。
必须逐步确认：目标读者、文章目标、语气风格、篇幅/深度、必须包含的内容。
只输出 JSON：
{{"reply":"下一句回复或问题","requirements":{{"audience":"","goal":"","tone":"","length":"","must_include":""}},"ready_for_outline":false}}
当五项已足够明确时，reply 总结需求，ready_for_outline=true。不要生成大纲或正文。

上下文：
{context}
用户消息：{message}
"""


OUTLINE_PROMPT = """根据已确认需求生成一份中文博客 Markdown 大纲。
只输出大纲，不要正文和解释。大纲必须包含建议标题、目标读者、核心结论、H2/H3 结构和每节一句写作目的。
需求：{requirements}
最近对话：{messages}
"""


OUTLINE_ADJUST_PROMPT = """根据反馈修改 Markdown 大纲，只输出完整新大纲。
需求：{requirements}
当前大纲：{outline}
反馈：{message}
"""


DRAFT_PROMPT = """根据已确认需求和大纲撰写完整中文博客 Markdown 初稿。
直接输出正文，以 # 标题开头；包含具体例子，避免空话；不要输出解释或 Markdown 围栏。
需求：{requirements}
大纲：{outline}
"""

DRAFT_ADJUST_PROMPT = """根据用户反馈修改完整初稿，只输出修改后的完整 Markdown。
需求：{requirements}
大纲：{outline}
当前初稿：{draft}
反馈：{message}
"""


# ── Phase 2：全文分析 + 非破坏性修订 ───────────────────────────────
# analyze 走非流式 chat 返回 JSON；selection/suggestion revision 走流式
# stream_chat，仅生成预览文本落库为 revisions 记录，不修改 draft/Article。

ANALYZE_PROMPT = """分析下面的中文博客，给出 3-5 条高价值修改建议。
只输出 JSON：{{"suggestions":[{{"type":"structure|argument|readability|seo|accuracy","title":"","reason":"","scope":""}}]}}
每条建议必须可执行且指明影响范围。
正文：{content}
"""

SELECTION_REVISION_PROMPT = """只改写指定段落。直接输出替换文本，不要标题、解释或 Markdown 围栏。
全文上下文：{context}
原段落：{selected_text}
修改要求：{instruction}
"""

SUGGESTION_REVISION_PROMPT = """根据以下建议修改文章，只输出需要替换的段落文本，不要解释。
建议类型：{suggestion_type}
建议标题：{suggestion_title}
建议原因：{suggestion_reason}
影响范围：{suggestion_scope}
正文：{content}
"""


class WritingSessionService:
    def __init__(self):
        self.agent = AgentService()

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

    # ── SSE 辅助 ───────────────────────────────────────────────────
    # 格式与 AgentService.event / error_event 对齐：
    #   {"content": "..."} / {"error": true, "message": "..."}，
    # 前端按 data.error === true 判断错误。
    @staticmethod
    def event(payload: dict) -> str:
        """格式化 SSE data 事件（ensure_ascii=False 让中文原样流过）。"""
        return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

    @staticmethod
    def error_event(message: str) -> str:
        """SSE 错误事件。"""
        return f"data: {json.dumps({'error': True, 'message': message}, ensure_ascii=False)}\n\n"

    # ── 澄清需求与大纲生成 ─────────────────────────────────────────
    async def clarification_reply(
        self, db: Session, session: WritingSession, message: str, provider_name=None
    ) -> tuple[str, bool]:
        """单轮澄清：把用户消息交给 LLM，返回 (回复, 是否已可生成大纲)。

        约定：reply 必须非空，否则抛 ValueError（由端点捕获转 400/SSE 错误事件）。
        每轮追加 user + assistant 两条消息，并更新 requirements_summary。
        """
        if session.stage != "clarifying":
            raise ConflictException(message=f"当前阶段'{session.stage}'不允许发送澄清消息")
        self.append_message(session, "user", message)
        provider = self.agent.get_provider(provider_name)
        prompt = CLARIFICATION_PROMPT.format(
            context=json.dumps(self.context_messages(session), ensure_ascii=False),
            message=message,
        )
        raw = await self.agent.ask_text(provider, prompt, temperature=0.3)
        data = json.loads(extract_first_json_object(raw))
        # 用 get 而不是 []：LLM 返回缺 reply 键时 KeyError 不会被端点的
        # except ValueError 捕获，会导致 SSE 流中断/500
        reply = str(data.get("reply", "")).strip()
        if not reply:
            raise ValueError("澄清回复为空")
        session.requirements_summary = {
            k: str(v).strip() for k, v in data.get("requirements", {}).items() if str(v).strip()
        }
        self.append_message(session, "assistant", reply)
        save_writing_session(db, session)
        return reply, bool(data.get("ready_for_outline"))

    async def generate_outline(
        self, db: Session, session: WritingSession, provider_name=None
    ) -> WritingSession:
        """首次生成大纲（仅允许 clarifying 阶段），写入并推进到 outline_review。"""
        if session.stage != "clarifying":
            raise ConflictException(message=f"当前阶段'{session.stage}'不允许生成大纲")
        provider = self.agent.get_provider(provider_name)
        prompt = OUTLINE_PROMPT.format(
            requirements=json.dumps(session.requirements_summary, ensure_ascii=False),
            messages=json.dumps(self.context_messages(session), ensure_ascii=False),
        )
        outline = await self.agent.ask_text(provider, prompt, temperature=0.4)
        outline = outline.strip()
        if not outline:
            raise ValueError("大纲为空")
        return self.store_outline(db, session, outline)

    async def adjust_outline(
        self, db: Session, session: WritingSession, message: str, provider_name=None
    ) -> WritingSession:
        """根据反馈修改大纲（仅允许 outline_review 阶段），覆盖并留在 outline_review。"""
        if session.stage != "outline_review":
            raise ConflictException(message=f"当前阶段'{session.stage}'不允许调整大纲")
        self.append_message(session, "user", message)
        provider = self.agent.get_provider(provider_name)
        prompt = OUTLINE_ADJUST_PROMPT.format(
            requirements=json.dumps(session.requirements_summary, ensure_ascii=False),
            outline=session.outline,
            message=message,
        )
        outline = await self.agent.ask_text(provider, prompt, temperature=0.4)
        outline = outline.strip()
        if not outline:
            raise ValueError("大纲为空")
        self.append_message(session, "assistant", outline)
        return self.store_outline(db, session, outline)

    # ── 初稿生成、调整与确认 ───────────────────────────────────────
    async def generate_draft_stream(
        self, db: Session, session: WritingSession, provider_name=None
    ) -> AsyncIterator[str]:
        """确认大纲后流式生成初稿。

        流程：begin_drafting（drafting）→ 流式吐正文 → 仅在流完整结束时
        store_draft（draft_review）。流式过程中异常不会推进阶段，保证
        「初稿未完成就不进 draft_review」的不变量（参见 interrupted_draft 测试）。

        约定：阶段校验必须在 endpoint 构造 StreamingResponse 之前完成，
        此方法第一行即抛 ConflictException（由全局处理器映射为 409）。
        """
        if session.stage != "outline_review":
            raise ConflictException(
                message=f"当前阶段'{session.stage}'不允许生成初稿，仅 outline_review 阶段可用"
            )
        if not session.outline.strip():
            raise ValueError("大纲为空，无法生成初稿")

        # 先转入 drafting（与 streaming 解耦：即使流中断，draft 也保持空）
        self.begin_drafting(db, session)

        provider = self.agent.get_provider(provider_name)
        prompt = DRAFT_PROMPT.format(
            requirements=json.dumps(session.requirements_summary, ensure_ascii=False),
            outline=session.outline,
        )

        chunks: list[str] = []
        completed = False
        try:
            async for content in self.agent.stream_content(provider, prompt, temperature=0.7):
                chunks.append(content)
                yield self.event({"content": content})
            completed = True
        except Exception as exc:
            # 流式失败：阶段留在 drafting，draft 为空，前端按 error 事件提示重试
            yield self.error_event(f"初稿生成失败：{exc}")
            yield "data: [DONE]\n\n"
            return

        if completed and chunks:
            full_draft = "".join(chunks).strip()
            if full_draft:
                self.store_draft(db, session, full_draft)
        yield "data: [DONE]\n\n"

    async def adjust_draft_stream(
        self, db: Session, session: WritingSession, message: str, provider_name=None
    ) -> AsyncIterator[str]:
        """根据反馈流式重写初稿（仅 draft_review 阶段可用）。

        与 generate_draft_stream 不同：此时已经在 draft_review，无需再走
        drafting 中转态；流式完成后直接覆盖 session.draft 并留在 draft_review，
        让用户继续调整或确认。
        """
        if session.stage != "draft_review":
            raise ConflictException(
                message=f"当前阶段'{session.stage}'不允许调整初稿，仅 draft_review 阶段可用"
            )
        if not session.draft.strip():
            raise ValueError("初稿为空，无法调整")

        self.append_message(session, "user", message)
        provider = self.agent.get_provider(provider_name)
        prompt = DRAFT_ADJUST_PROMPT.format(
            requirements=json.dumps(session.requirements_summary, ensure_ascii=False),
            outline=session.outline,
            draft=session.draft,
            message=message,
        )

        chunks: list[str] = []
        completed = False
        try:
            async for content in self.agent.stream_content(provider, prompt, temperature=0.6):
                chunks.append(content)
                yield self.event({"content": content})
            completed = True
        except Exception as exc:
            yield self.error_event(f"初稿调整失败：{exc}")
            yield "data: [DONE]\n\n"
            return

        if completed and chunks:
            full_draft = "".join(chunks).strip()
            if full_draft:
                session.draft = full_draft
                # 先追加消息再保存：原顺序会把 assistant 消息落在 commit 之后丢失
                self.append_message(session, "assistant", full_draft)
                save_writing_session(db, session)
        yield "data: [DONE]\n\n"

    def confirm_draft_payload(self, db: Session, session: WritingSession) -> WritingSession:
        """确认初稿，转入 editing 阶段，返回更新后的会话（含 stage=editing 与 draft 正文）。

        直接返回 WritingSession 模型：其 schema（WritingSessionRead）已含 stage 与 draft
        字段，前端可同时拿到阶段和初稿正文，无需额外的嵌套响应结构。
        """
        return self.confirm_draft(db, session)

    # ── Phase 2：全文分析与非破坏性修订 ────────────────────────────
    # 设计要点：
    #   - analyze：非流式，写入 session.suggestions（每条带 id + status=pending）。
    #   - revise_selection_stream / revise_suggestion_stream：流式生成预览文本，
    #     仅在流完整结束时追加一条 revisions 记录（status=previewed），不触碰 draft
    #     或 Article。前端拿到 revision_id 后，再通过 apply-revision 真正落地，
    #     或通过 discard-revision 放弃。
    #   - apply_revision：hash 校验通过则标记 applied，并联动更新关联 suggestion。
    #     hash 不匹配（用户在编辑器里改过正文）抛 ConflictException（409）。
    #   - discard_revision：仅改状态为 discarded。

    async def analyze_content(
        self,
        db: Session,
        session: WritingSession,
        content: str,
        content_hash: str,
        provider_name=None,
    ) -> WritingSession:
        """分析全文，返回结构化建议并存入 session.suggestions。

        约定：仅在 editing 阶段可用；模型输出经 extract_first_json_object 容错解析。
        每条建议自动补 id 与 status=pending，覆盖历史 suggestions。
        """
        if session.stage != "editing":
            raise ConflictException(message=f"当前阶段'{session.stage}'不允许分析全文")
        provider = self.agent.get_provider(provider_name)
        prompt = ANALYZE_PROMPT.format(content=content)
        raw = await self.agent.ask_text(provider, prompt, temperature=0.3)
        data = json.loads(extract_first_json_object(raw))
        suggestions = []
        for s in data.get("suggestions", []):
            suggestions.append({
                "id": str(uuid.uuid4()),
                "type": s.get("type", "readability"),
                "title": s.get("title", ""),
                "reason": s.get("reason", ""),
                "scope": s.get("scope", ""),
                "status": "pending",
            })
        session.suggestions = suggestions
        return save_writing_session(db, session)

    async def revise_selection_stream(
        self,
        db: Session,
        session: WritingSession,
        request_data,
        provider_name=None,
    ) -> AsyncIterator[str]:
        """流式生成选中段落的修改预览，不修改 draft 或 Article。

        约定：仅在 editing 阶段可用（阶段校验已在 endpoint 构造 StreamingResponse
        之前完成，此处冗余校验防止服务层被直接误用）；流完整结束时落库一条
        revisions 记录（status=previewed），并发 meta.revision_id 事件。
        """
        if session.stage != "editing":
            raise ConflictException(message=f"当前阶段'{session.stage}'不允许修改选段")

        provider = self.agent.get_provider(provider_name)
        prompt = SELECTION_REVISION_PROMPT.format(
            # 截断上下文，避免单次请求 token 过大
            context=request_data.content[:2000],
            selected_text=request_data.selected_text,
            instruction=request_data.instruction,
        )

        chunks: list[str] = []
        completed = False
        revision_id = str(uuid.uuid4())
        try:
            async for content in self.agent.stream_content(provider, prompt, temperature=0.5):
                chunks.append(content)
                yield self.event({"content": content})
            completed = True
        except Exception as exc:
            yield self.error_event(f"选段修改失败：{exc}")
            yield "data: [DONE]\n\n"
            return

        if completed and chunks:
            replacement = "".join(chunks).strip()
            revisions = list(session.revisions or [])
            revisions.append({
                "id": revision_id,
                "source": "selection",
                "suggestion_id": None,
                "content_hash": request_data.content_hash,
                "selection_start": request_data.selection_start,
                "selection_end": request_data.selection_end,
                "original_text": request_data.selected_text,
                "replacement_text": replacement,
                "status": "previewed",
            })
            session.revisions = revisions
            save_writing_session(db, session)
            yield self.event({"meta": {"revision_id": revision_id}})
        yield "data: [DONE]\n\n"

    async def revise_suggestion_stream(
        self,
        db: Session,
        session: WritingSession,
        suggestion_id: str,
        content: str,
        content_hash: str,
        provider_name=None,
    ) -> AsyncIterator[str]:
        """根据建议生成修改预览（流式），不修改 draft 或 Article。

        约定：建议必须存在（否则 NotFoundException，应在 StreamingResponse 之前抛出）；
        流完整结束时落库一条 revisions 记录（source=suggestion、关联 suggestion_id），
        并把对应 suggestion 标记为 previewed。
        """
        if session.stage != "editing":
            raise ConflictException(message=f"当前阶段'{session.stage}'不允许修改")

        suggestion = None
        for s in (session.suggestions or []):
            if s["id"] == suggestion_id:
                suggestion = s
                break
        if not suggestion:
            raise NotFoundException(resource="WritingSuggestion", identifier=suggestion_id)

        provider = self.agent.get_provider(provider_name)
        prompt = SUGGESTION_REVISION_PROMPT.format(
            suggestion_type=suggestion.get("type", "readability"),
            suggestion_title=suggestion.get("title", ""),
            suggestion_reason=suggestion.get("reason", ""),
            suggestion_scope=suggestion.get("scope", ""),
            content=content[:3000],
        )

        chunks: list[str] = []
        completed = False
        revision_id = str(uuid.uuid4())
        try:
            async for piece in self.agent.stream_content(provider, prompt, temperature=0.5):
                chunks.append(piece)
                yield self.event({"content": piece})
            completed = True
        except Exception as exc:
            yield self.error_event(f"建议修改失败：{exc}")
            yield "data: [DONE]\n\n"
            return

        if completed and chunks:
            replacement = "".join(chunks).strip()
            revisions = list(session.revisions or [])
            revisions.append({
                "id": revision_id,
                "source": "suggestion",
                "suggestion_id": suggestion_id,
                "content_hash": content_hash,
                "selection_start": 0,
                "selection_end": 0,
                "original_text": "",
                "replacement_text": replacement,
                "status": "previewed",
            })
            session.revisions = revisions
            # 把对应建议标为 previewed（已生成预览，等待 apply/discard）。
            # 重建列表以触发 JSON 列变更（见 apply_revision 注释）。
            session.suggestions = [
                {**s, "status": "previewed"} if s["id"] == suggestion_id else dict(s)
                for s in (session.suggestions or [])
            ]
            save_writing_session(db, session)
            yield self.event({"meta": {"revision_id": revision_id}})
        yield "data: [DONE]\n\n"

    def apply_revision(
        self,
        db: Session,
        session: WritingSession,
        revision_id: str,
        content_hash: str,
    ) -> WritingSession:
        """标记修订为已应用；content_hash 不匹配则拒绝。

        hash 不匹配意味着用户在编辑器里改过正文，旧的修订定位已失效，
        强制重新选择段落。

        实现细节：revisions 是 JSON 列里的异构 dict 列表。SQLAlchemy 的 JSON
        列默认不做「字典内部就地修改」的可变性追踪，因此这里必须重建整份
        列表（用全新 dict 拷贝）再整体赋值给 session.revisions，才能保证
        UPDATE 真正下发；同理联动更新 suggestions 时也重建列表。
        """
        old_revisions = list(session.revisions or [])
        target = next((r for r in old_revisions if r["id"] == revision_id), None)
        if not target:
            raise NotFoundException(resource="WritingRevision", identifier=revision_id)
        if target.get("content_hash") != content_hash:
            raise ConflictException(message="正文已变化，无法应用此修改。请重新选择段落。")

        suggestion_id = target.get("suggestion_id")
        new_revisions = [
            {**r, "status": "applied"} if r["id"] == revision_id else dict(r)
            for r in old_revisions
        ]
        session.revisions = new_revisions

        # 联动把关联建议标为 applied（同样重建列表以触发 JSON 列变更）
        if suggestion_id:
            session.suggestions = [
                {**s, "status": "applied"} if s.get("id") == suggestion_id else dict(s)
                for s in (session.suggestions or [])
            ]
        return save_writing_session(db, session)

    def discard_revision(
        self,
        db: Session,
        session: WritingSession,
        revision_id: str,
    ) -> WritingSession:
        """放弃修订（仅改状态为 discarded，保留记录便于审计）。

        同 apply_revision：重建整份 revisions 列表（全新 dict 拷贝）触发 JSON 列变更。
        """
        old_revisions = list(session.revisions or [])
        target = next((r for r in old_revisions if r["id"] == revision_id), None)
        if not target:
            raise NotFoundException(resource="WritingRevision", identifier=revision_id)
        session.revisions = [
            {**r, "status": "discarded"} if r["id"] == revision_id else dict(r)
            for r in old_revisions
        ]
        return save_writing_session(db, session)
