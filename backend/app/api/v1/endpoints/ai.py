"""AI 无状态生成端点：文章摘要等一次性生成能力。

与 /agent/* 的区别：无工具循环、不落库，输入即生成、即刻返回。
provider 选择走 provider_factory（与 agent_service 同惯例）；
LLM 调用失败统一抛 LLMServiceException（502，由全局 AppException 处理器接管）。
"""

from typing import Optional

from fastapi import APIRouter, Depends, Request

from app.core.config import settings
from app.core.dependencies import get_current_active_user
from app.exceptions import LLMServiceException
from app.llm.base import LLMProvider
from app.llm.provider_factory import get_llm_provider
from app.models.user import User
from app.schemas.ai import ArticleSummaryRequest, ArticleSummaryResponse
from app.services.agent_service import agent_service
from app.utils.logger import app_logger
from app.utils.rate_limit import llm_chat_rate_limit

router = APIRouter()

# 正文超长时截断到模型安全长度，避免超上下文窗口与费用失控
MAX_SUMMARY_INPUT_CHARS = 6000

# 摘要生成 prompt：中文、客观、纯文本、限长
SUMMARY_PROMPT = """请为下面的博客文章写一段中文摘要。

要求：
1. 客观概括文章核心内容，不引入文中没有的观点。
2. 直接输出纯文本摘要，不超过 {max_length} 字；不要任何解释、前缀或 markdown 围栏。
3. 保留关键术语，语句连贯完整。

【标题】
{title}

【正文】
{content}"""


@router.post("/article-summary", response_model=ArticleSummaryResponse)
@llm_chat_rate_limit
async def ai_article_summary(
    request: Request,
    summary_request: ArticleSummaryRequest,
    current_user: User = Depends(get_current_active_user),
) -> ArticleSummaryResponse:
    """根据标题 + 正文生成文章摘要（无状态不落库，编辑器自行填写 excerpt）。"""
    app_logger.info(f"AI article-summary by user={current_user.username}")

    provider: Optional[LLMProvider] = get_llm_provider(None)
    if provider is None:
        raise LLMServiceException(
            provider="default",
            message="LLM provider 不可用，请检查 API key 配置",
        )

    prompt = SUMMARY_PROMPT.format(
        title=summary_request.title,
        # content 过长截断，保护上下文窗口（服务端兜底，schema 已限总长）
        content=summary_request.content[:MAX_SUMMARY_INPUT_CHARS],
        max_length=summary_request.max_length,
    )
    try:
        # 摘要属确定性输出（概述类），复用 agent_service 薄封装 + 结构化温度
        summary = await agent_service.ask_text(
            provider, prompt, temperature=settings.LLM_TEMPERATURE_STRUCTURED
        )
    except LLMServiceException:
        raise
    except Exception as e:
        app_logger.error("AI 文章摘要生成失败", exc_info=True)
        raise LLMServiceException(
            provider=provider.get_provider_name(),
            message="文章摘要生成失败",
            original_error=e,
        )

    return ArticleSummaryResponse(summary=summary.strip())
