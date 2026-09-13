from pydantic import BaseModel, Field, field_serializer
from typing import Optional
from datetime import datetime
from uuid import UUID


class SubscriptionBase(BaseModel):
    email: str
    is_active: Optional[bool] = True
    is_verified: Optional[bool] = False


class SubscriptionCreate(SubscriptionBase):
    email: str


class SubscriptionUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class SubscriptionInDBBase(SubscriptionBase):
    id: UUID
    verification_token: Optional[str] = None
    subscribed_at: datetime
    verified_at: Optional[datetime] = None
    unsubscribed_at: Optional[datetime] = None

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    model_config = {'from_attributes': True}


class Subscription(SubscriptionInDBBase):
    # 响应中剔除验证令牌：知道邮箱即可通过重复订阅响应拿到 token 替人验证（安全审查 2026-09-12）
    verification_token: Optional[str] = Field(default=None, exclude=True)


class SubscriptionRequest(BaseModel):
    email: str


class SubscriptionVerification(BaseModel):
    token: str