from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_serializer

WritingStage = Literal["clarifying", "outline_review", "drafting", "draft_review", "editing", "completed"]
WritingStatus = Literal["active", "completed", "abandoned"]


class WritingMessage(BaseModel):
    id: str
    role: Literal["user", "assistant", "system"]
    content: str
    created_at: datetime


class WritingSuggestion(BaseModel):
    id: str
    type: Literal["structure", "argument", "readability", "seo", "accuracy"]
    title: str
    reason: str
    scope: str
    status: Literal["pending", "previewed", "applied", "dismissed"] = "pending"


class WritingSessionCreate(BaseModel):
    article_id: Optional[UUID] = None


class WritingSessionRead(BaseModel):
    id: UUID
    user_id: UUID
    article_id: Optional[UUID]
    stage: WritingStage
    status: WritingStatus
    requirements_summary: dict[str, str]
    outline: str
    draft: str
    messages: list[WritingMessage]
    suggestions: list[WritingSuggestion]
    revisions: list[dict]
    created_at: datetime
    updated_at: datetime

    @field_serializer("id", "user_id", "article_id")
    def serialize_uuid(self, value: Optional[UUID]):
        return str(value) if value else None

    model_config = {"from_attributes": True}


class WritingMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)


class WritingOutlineAdjustRequest(WritingMessageRequest):
    pass


class WritingDraftAdjustRequest(WritingMessageRequest):
    pass


class WritingAnalyzeRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=30000)
    content_hash: str = Field(..., min_length=16, max_length=128)


class WritingSelectionRevisionRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=30000)
    selected_text: str = Field(..., min_length=1, max_length=10000)
    selection_start: int = Field(..., ge=0)
    selection_end: int = Field(..., ge=1)
    instruction: str = Field(..., min_length=1, max_length=1000)
    content_hash: str = Field(..., min_length=16, max_length=128)


class WritingSuggestionRevisionRequest(BaseModel):
    suggestion_id: str
    content: str = Field(..., min_length=1, max_length=30000)
    content_hash: str = Field(..., min_length=16, max_length=128)


class WritingRevisionApplyRequest(BaseModel):
    revision_id: str
    content_hash: str = Field(..., min_length=16, max_length=128)


class WritingRevisionDiscardRequest(BaseModel):
    revision_id: str


class WritingArticleLinkRequest(BaseModel):
    article_id: UUID
