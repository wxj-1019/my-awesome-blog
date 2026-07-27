"""Agent 服务层：组装 provider + 工具 + 循环引擎，对外提供 chat / polish / 流式写作。

约定：本服务抛出的 ValueError 由 API 端点捕获并转为 HTTP 400。
"""

import json
from typing import AsyncIterator, Optional

from sqlalchemy.orm import Session

from app.agent.loop import AgentLoop
from app.agent.tools.builtin import register_builtin_tools
from app.agent.tools.registry import ToolRegistry
from app.llm.base import ChatCompletionRequest, ChatMessage, LLMProvider
from app.llm.provider_factory import get_llm_provider
from app.utils.logger import app_logger
from app.schemas.agent import (
    AgentChatRequest,
    AgentChatResponse,
    AgentCoverRequest,
    AgentCoverResponse,
    AgentGenerateRequest,
    AgentMetaRequest,
    AgentMetaResponse,
    AgentPolishRequest,
    AgentPolishResponse,
    AgentReviseRequest,
    AgentToolCallInfo,
    CoverImage,
)

AGENT_SYSTEM_PROMPT = """你是这个个人博客站点的「写作助手」，帮助博主选题、查站内旧文、列大纲、改写与润色。
你可以使用工具查询站内已发布文章、文章详情和站点统计。
规则：
1. 主目标是协助写文章：可先 search_articles / get_article_detail 找相关旧文，再给大纲、段落或修改建议。
2. 涉及站内内容时，先调工具再基于返回事实回答，不要编造标题或链接。
3. 文章链接格式为 /articles/{slug}。
4. 用简洁的中文；需要成稿润色时，可建议用户使用管理端 polish 接口做 Writer-Critic 循环。"""

CRITIC_PROMPT = """你是一名严格的中文博客文章评审。审阅下面的草稿，从结构、可读性、事实准确性、SEO 角度提出最多 3 条具体修改建议（每条一行）。
如果草稿质量已经足够好、无需修改，只回复：PASS
{requirements_block}
【草稿】
{draft}"""

WRITER_PROMPT = """你是一名专业的中文博客作者。根据评审意见修改下面的草稿，直接输出修改后的完整文章（Markdown），不要输出任何解释。

【评审意见】
{critique}

【草稿】
{draft}"""


# ── AI 导向写作 prompt ──────────────────────────────────────────────
# 生成 / 改稿 / 元信息三套 prompt。
# 生成与改稿走流式（stream_chat），元信息走一次性 chat（输出短、要解析 JSON）。


GENERATE_PROMPT = """你是一名资深中文博客作者。请按下面的要求撰写一篇完整文章，**直接输出 Markdown 正文**，不要任何前置说明、不要 ```markdown 围栏。

写作要求：
1. 结构清晰：以 `# 标题` 开头，含 `##` 小节；适当使用列表、引用、代码块。
2. 语言自然流畅，有观点、有例子，避免空话套话和 AI 腔。
3. 只输出文章本身，不要「好的，以下是文章」之类的开场白。
{requirements_block}{context_block}
【主题】
{topic}"""

REVISE_PROMPT = """你是一名中文博客编辑。请按修改指令调整下面的文章，**直接输出修改后的完整 Markdown 正文**，不要解释你做了什么。

要求：
1. 保留未涉及部分，只按指令改动。
2. 仍以 `# 标题` 开头，保持 Markdown 结构完整。
3. 不要加任何开场白或说明。

【修改指令】
{instruction}

【当前正文】
{content}"""

META_PROMPT = """根据下面的文章正文，生成适合博客的标题、URL slug 和摘要。**只输出一个 JSON 对象**，不要任何解释或 markdown 围栏，格式严格为：
{{"title": "...", "slug": "...", "excerpt": "..."}}

要求：
- title：15-40 字，有吸引力，不含书名号/引号。
- slug：英文小写短横线分隔，仅 a-z0-9-，由 title 含义翻译而来，不超过 60 字符。
- excerpt：80-150 字中文摘要，概括核心观点，不含换行。

【正文】
{content}"""


COVER_QUERY_PROMPT = """根据下面的文章正文，提取 1-3 个**英文**关键词，用于在 Unsplash 图库搜索配图。

要求：
1. 关键词要能搜出与文章主题相关的、视觉表现力强的图片（偏具象名词，如 docker、coding、mountain）。
2. 只输出关键词，用单个空格分隔，**不要**输出任何解释、标点或句子。
3. 抽象主题（如「架构」「哲学」）退化为可拍照的具体物（如 building、books）。

【正文】
{content}"""


class AgentService:
    """Agent 服务：chat 走工具循环，polish 走 Writer-Critic 循环。"""

    def _get_provider_or_raise(self, provider_name: Optional[str]) -> LLMProvider:
        provider = get_llm_provider(provider_name)
        if provider is None:
            raise ValueError(f"LLM provider「{provider_name or '默认'}」不可用，请检查 API key 配置")
        return provider

    # ── 对外公开的薄封装 ───────────────────────────────────────────
    # 让 WritingSessionService 及后续任务可以直接复用底层能力，
    # 不必跨服务边界调用下划线私有方法。
    def get_provider(self, provider_name: Optional[str] = None) -> LLMProvider:
        return self._get_provider_or_raise(provider_name)

    async def ask_text(self, provider: LLMProvider, prompt: str, temperature: float = 0.7) -> str:
        return await self._ask(provider, prompt, temperature)

    async def stream_text(
        self,
        provider,
        prompt,
        model=None,
        temperature=0.7,
        max_tokens=None,
    ) -> AsyncIterator[str]:
        async for event in self._stream_final(provider, prompt, model, temperature, max_tokens):
            yield event

    async def chat(self, db: Session, request: AgentChatRequest) -> AgentChatResponse:
        """工具循环对话：模型可自主调用站内工具后作答。"""
        provider = self._get_provider_or_raise(request.provider)
        registry = register_builtin_tools(ToolRegistry())
        loop = AgentLoop(provider, registry, max_iterations=request.max_iterations)
        result = await loop.run(db, [
            ChatMessage(role="system", content=AGENT_SYSTEM_PROMPT),
            ChatMessage(role="user", content=request.message),
        ], model=request.model)
        return AgentChatResponse(
            reply=result.reply,
            provider=provider.get_provider_name(),
            model=request.model or provider.get_model_name(),
            iterations=result.iterations,
            stop_reason=result.stop_reason,
            tool_calls=[AgentToolCallInfo(**t) for t in result.tool_trace],
            total_tokens=result.total_tokens,
        )

    async def polish(self, request: AgentPolishRequest) -> AgentPolishResponse:
        """Writer-Critic 循环润色：评审 → 修改 → 再评审，直到 PASS 或达到轮数上限。
        达到 max_rounds 后最后一轮改写不再送评审，直接返回。"""
        provider = self._get_provider_or_raise(None)
        draft = request.content
        critiques: list[str] = []
        requirements_block = f"\n【附加要求】{request.requirements}\n" if request.requirements else ""

        for round_idx in range(request.max_rounds):
            critique = await self._ask(
                provider, CRITIC_PROMPT.format(draft=draft, requirements_block=requirements_block),
                temperature=0.3,
            )
            if critique.strip().upper().rstrip("。").rstrip(".") == "PASS":
                app_logger.info(f"Agent polish 第 {round_idx + 1} 轮评审通过（PASS）")
                break
            critiques.append(critique)
            draft = await self._ask(provider, WRITER_PROMPT.format(draft=draft, critique=critique))

        return AgentPolishResponse(polished=draft, rounds=len(critiques), critiques=critiques)

    @staticmethod
    async def _ask(provider: LLMProvider, prompt: str, temperature: float = 0.7) -> str:
        """单次无工具调用，返回文本。"""
        response = await provider.chat(ChatCompletionRequest(
            messages=[ChatMessage(role="user", content=prompt)],
            temperature=temperature,
        ))
        return response.message.content

    # ── SSE 辅助 ───────────────────────────────────────────────────
    @staticmethod
    def event(payload: dict) -> str:
        """格式化一条 SSE data 事件（ensure_ascii=False 让中文原样流过）。"""
        return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

    @staticmethod
    def error_event(message: str) -> str:
        """SSE 错误事件。格式与 llm_service._format_sse_error 对齐：
        {"error": true, "message": "..."}，前端按 data.error === true 判断。"""
        return f"data: {json.dumps({'error': True, 'message': message}, ensure_ascii=False)}\n\n"

    async def _stream_final(
        self,
        provider: LLMProvider,
        prompt: str,
        model: Optional[str],
        temperature: float,
        max_tokens: Optional[int],
    ) -> AsyncIterator[str]:
        """最终的流式生成：把拼好的 prompt 喂给 provider.stream_chat，逐 chunk 发 SSE。

        content 事件：{"content": "..."}；最后发 [DONE]。错误发 {"error": true, "message": "...}。
        """
        try:
            request = ChatCompletionRequest(
                messages=[ChatMessage(role="user", content=prompt)],
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
            async for chunk in provider.stream_chat(request):
                if chunk.content:
                    yield self.event({"content": chunk.content})
        except Exception as e:
            app_logger.exception("Agent 流式生成失败")
            yield self.error_event(str(e))
            return
        yield "data: [DONE]\n\n"

    # ── AI 导向写作：生成 / 改稿 / 元信息 ──────────────────────────
    async def generate_stream(
        self, db: Session, request: AgentGenerateRequest
    ) -> AsyncIterator[str]:
        """按主题流式生成文章。

        两阶段（贴合现有架构，低风险）：
        1. 若 context_mode=auto，跑非流式 AgentLoop 查站内相关文章，把摘要注入 prompt；
           每次工具调用先发一个 tool 事件，让前端显示「正在检索站内文章…」。
        2. 用 provider.stream_chat 流式吐 Markdown 正文，逐 chunk 发 content 事件。
        """
        # provider 解析在函数体首行：未配置时第一行就 yield error，endpoint 无需 catch
        try:
            provider = self._get_provider_or_raise(request.provider)
        except ValueError as e:
            yield self.error_event(str(e))
            yield "data: [DONE]\n\n"
            return

        context_block = ""
        if request.context_mode == "auto":
            registry = register_builtin_tools(ToolRegistry())
            loop = AgentLoop(provider, registry, max_iterations=request.max_iterations)
            # 让 agent 先检索站内相关文章，只取它的回复作上下文（reply 本身可能就是摘要/大纲）
            try:
                result = await loop.run(
                    db,
                    [
                        ChatMessage(role="system", content=AGENT_SYSTEM_PROMPT),
                        ChatMessage(
                            role="user",
                            content=(
                                f"我想写一篇关于「{request.topic}」的文章。"
                                "请先用工具检索站内是否已有相关或风格相近的文章，"
                                "然后用 3-5 行概述你找到的参考（标题 + 一句话要点），"
                                "便于我在写作时保持风格一致、避免重复。只概述，不要写成正文。"
                            ),
                        ),
                    ],
                    model=request.model,
                )
                for trace in result.tool_trace:
                    yield self.event({"tool": trace.get("name"), "arguments": trace.get("arguments")})
                if result.reply.strip():
                    context_block = f"\n【站内相关参考】（写作时保持风格一致、避免与已发布内容重复）\n{result.reply.strip()}\n"
            except Exception as e:
                # 检索失败不阻塞生成，降级为无上下文
                app_logger.warning(f"Agent 站内检索失败，降级为无上下文生成：{e}")
                yield self.event({"tool": "error", "arguments": {"message": str(e)}})

        requirements_block = (
            f"\n【附加要求】{request.requirements}\n" if request.requirements else ""
        )
        prompt = GENERATE_PROMPT.format(
            topic=request.topic,
            requirements_block=requirements_block,
            context_block=context_block,
        )
        async for sse in self._stream_final(
            provider, prompt, request.model, request.temperature, request.max_tokens
        ):
            yield sse

    async def revise_stream(
        self, request: AgentReviseRequest
    ) -> AsyncIterator[str]:
        """流式改稿：当前正文 + 自然语言指令 → 流式输出修改后的完整正文。"""
        try:
            provider = self._get_provider_or_raise(request.provider)
        except ValueError as e:
            yield self.error_event(str(e))
            yield "data: [DONE]\n\n"
            return
        prompt = REVISE_PROMPT.format(instruction=request.instruction, content=request.content)
        async for sse in self._stream_final(
            provider, prompt, request.model, request.temperature, request.max_tokens
        ):
            yield sse

    async def generate_meta(self, request: AgentMetaRequest) -> AgentMetaResponse:
        """根据正文反推 title / slug / excerpt（非流式，输出 JSON）。"""
        provider = self._get_provider_or_raise(request.provider)
        prompt = META_PROMPT.format(content=request.content)
        raw = await self._ask(provider, prompt, temperature=0.3)
        # 容错：模型偶尔会包 ```json 围栏或夹带叙述文本，用括号配平提取首个完整 JSON 对象
        raw = raw.strip()
        if raw.startswith("```"):
            # 去掉首尾围栏；语言标记（json）也一并去掉
            raw = raw.split("```", 2)[1] if raw.count("```") >= 2 else raw
            raw = raw.strip()
            if raw.lower().startswith("json"):
                raw = raw[4:].strip()
        try:
            json_str = self._extract_first_json_object(raw)
        except ValueError as e:
            raise ValueError("AI 返回的内容无法解析为标题/摘要，请重试或手填") from e
        try:
            data = json.loads(json_str)
            return AgentMetaResponse(
                title=str(data.get("title", "")).strip(),
                slug=str(data.get("slug", "")).strip(),
                excerpt=str(data.get("excerpt", "")).strip(),
            )
        except json.JSONDecodeError as e:
            raise ValueError(f"解析 AI 元信息失败：{e}") from e

    @staticmethod
    def _extract_first_json_object(raw: str) -> str:
        """从可能夹带叙述的文本里提取首个**平衡**的 {...} JSON 对象。

        比 find/rfind 更稳：正确处理字符串内的花括号（如代码示例）和
        模型输出多个 JSON 对象的情况（只取第一个完整对象）。
        """
        depth = 0
        start = -1
        in_str = False
        escaped = False
        for i, ch in enumerate(raw):
            if escaped:
                escaped = False
                continue
            if ch == "\\":
                escaped = True
                continue
            if ch == '"':
                in_str = not in_str
                continue
            if in_str:
                continue
            if ch == "{":
                if depth == 0:
                    start = i
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0 and start != -1:
                    return raw[start:i + 1]
        raise ValueError("未找到平衡的 JSON 对象")

    # ── 封面配图搜索 ───────────────────────────────────────────────
    # 多源策略（COVER_SOURCE 控制）：
    #   - pexels（默认）：国内可达、注册即拿 key、图片质量高、免费商用
    #   - auto：有 pexels key 用 pexels，否则尝试 openverse（国内可能超时）
    #   - unsplash / openverse：强制指定（前者质量好需 key，后者零配置但国内常超时）

    async def suggest_cover(self, request: AgentCoverRequest) -> AgentCoverResponse:
        """AI 生成搜索词（若未手填）→ 按图源搜索 → 返回候选图。

        错误自处理：图源不可用/网络错误均抛 ValueError，由端点转 400。
        """
        from app.core.config import settings

        source = (settings.COVER_SOURCE or "pexels").strip().lower()
        has_pexels = bool(settings.PEXELS_API_KEY.strip())
        has_unsplash = bool(settings.UNSPLASH_ACCESS_KEY.strip())

        # 解析实际使用的图源
        if source == "pexels":
            if not has_pexels:
                raise ValueError("图源设为 pexels 但未配置 PEXELS_API_KEY")
            use = "pexels"
        elif source == "unsplash":
            if not has_unsplash:
                raise ValueError("图源设为 unsplash 但未配置 UNSPLASH_ACCESS_KEY")
            use = "unsplash"
        elif source == "openverse":
            use = "openverse"
        else:  # auto
            if has_pexels:
                use = "pexels"
            elif has_unsplash:
                use = "unsplash"
            else:
                use = "openverse"

        # 1. 确定搜索词：用户手填优先，否则让 AI 从正文提取
        query = (request.query or "").strip()
        if not query:
            provider = self._get_provider_or_raise(request.provider)
            raw_query = await self._ask(
                provider,
                COVER_QUERY_PROMPT.format(content=request.content),
                temperature=0.3,
            )
            query = " ".join(raw_query.strip().splitlines())[:100].strip()
            if not query:
                query = "technology"

        # 2. 按图源搜索
        if use == "pexels":
            return await self._search_pexels(query)
        if use == "unsplash":
            return await self._search_unsplash(query)
        return await self._search_openverse(query)

    async def _search_pexels(self, query: str) -> AgentCoverResponse:
        """Pexels 搜索（国内可达，需 API key，免费商用）。

        响应字段：photos[].src.large（封面用）、.src.medium（缩略）、
        .alt（描述）、.photographer（作者）、.photographer_url（作者主页）。
        """
        from app.core.config import settings
        import httpx

        key = settings.PEXELS_API_KEY.strip()
        per_page = settings.COVER_PER_PAGE
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    "https://api.pexels.com/v1/search",
                    params={"query": query, "per_page": per_page, "orientation": "landscape"},
                    headers={"Authorization": key},
                )
        except httpx.HTTPError as e:
            app_logger.warning(f"Pexels 请求失败：{e}")
            raise ValueError(f"无法访问 Pexels 图库：{e}") from e

        if resp.status_code != 200:
            app_logger.warning(f"Pexels 返回 {resp.status_code}: {resp.text[:200]}")
            raise ValueError(f"Pexels 搜索失败（HTTP {resp.status_code}）")

        photos = resp.json().get("photos", [])
        images = [
            CoverImage(
                url=p.get("src", {}).get("large", ""),
                thumb_url=p.get("src", {}).get("medium", "") or p.get("src", {}).get("large", ""),
                alt=p.get("alt") or "",
                author_name=p.get("photographer") or "",
                author_url=p.get("photographer_url") or "",
            )
            for p in photos
            if p.get("src", {}).get("large")
        ]
        return AgentCoverResponse(query=query, images=images)

    async def _search_unsplash(self, query: str) -> AgentCoverResponse:
        """Unsplash 搜索（需 access key，国内可达）。"""
        from app.core.config import settings
        import httpx

        key = settings.UNSPLASH_ACCESS_KEY.strip()
        per_page = settings.COVER_PER_PAGE
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    "https://api.unsplash.com/search/photos",
                    params={"query": query, "per_page": per_page, "orientation": "landscape"},
                    headers={"Authorization": f"Client-ID {key}"},
                )
        except httpx.HTTPError as e:
            app_logger.warning(f"Unsplash 请求失败：{e}")
            raise ValueError(f"无法访问 Unsplash 图库：{e}") from e

        if resp.status_code != 200:
            app_logger.warning(f"Unsplash 返回 {resp.status_code}: {resp.text[:200]}")
            raise ValueError(f"Unsplash 搜索失败（HTTP {resp.status_code}）")

        results = resp.json().get("results", [])
        images = [
            CoverImage(
                url=item.get("urls", {}).get("regular", ""),
                thumb_url=item.get("urls", {}).get("thumb", ""),
                alt=item.get("alt_description") or "",
                author_name=item.get("user", {}).get("name", ""),
                author_url=item.get("user", {}).get("links", {}).get("html", ""),
            )
            for item in results
            if item.get("urls", {}).get("regular")
        ]
        return AgentCoverResponse(query=query, images=images)

    async def _search_openverse(self, query: str) -> AgentCoverResponse:
        """Openverse 搜索（无需 key，聚合 Wikimedia/Flickr 等 CC 版权图）。

        注意：国内服务器访问 api.openverse.org 常超时，仅在无 key 时作 fallback。
        默认只筛宽松协议（cc0/pdm/by/by-sa），避免 NC/ND 版权风险。
        """
        from app.core.config import settings
        import httpx

        per_page = settings.COVER_PER_PAGE
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    "https://api.openverse.org/v1/images/",
                    params={
                        "q": query,
                        "page_size": per_page,
                        "license": "cc0,pdm,by,by-sa",
                        "aspect_ratio": "wide",
                    },
                )
        except httpx.HTTPError as e:
            app_logger.warning(f"Openverse 请求失败：{e}")
            raise ValueError(f"无法访问 Openverse 图库：{e}") from e

        if resp.status_code != 200:
            app_logger.warning(f"Openverse 返回 {resp.status_code}: {resp.text[:200]}")
            raise ValueError(f"Openverse 搜索失败（HTTP {resp.status_code}）")

        results = resp.json().get("results", [])
        images = []
        for item in results:
            url = item.get("url") or ""
            if not url:
                continue
            thumb = item.get("thumbnail") or ""
            if thumb and thumb.startswith("/"):
                thumb = f"https://api.openverse.org{thumb}"
            images.append(CoverImage(
                url=url,
                thumb_url=thumb or url,
                alt=item.get("title") or "",
                author_name=item.get("creator") or "",
                author_url=item.get("creator_url") or "",
            ))
        return AgentCoverResponse(query=query, images=images)


agent_service = AgentService()
