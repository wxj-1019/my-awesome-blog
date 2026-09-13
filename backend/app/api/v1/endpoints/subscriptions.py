from typing import Any, List
from fastapi import APIRouter, BackgroundTasks, Query, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_superuser
from app.exceptions import BadRequestException
from app import crud
from app.schemas.subscription import (
    Subscription,
    SubscriptionCreate,
    SubscriptionUpdate,
    SubscriptionVerification,
)
from app.models.subscription import Subscription as SubscriptionModel
from app.models.user import User
from app.services.email_service import email_service

router = APIRouter()


@router.get("/", response_model=List[Subscription])
def read_subscriptions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_active: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Retrieve subscriptions
    """
    subscriptions = crud.get_subscriptions(
        db, 
        skip=skip, 
        limit=limit, 
        is_active=is_active
    )
    return subscriptions


@router.post("/", response_model=Subscription, status_code=status.HTTP_201_CREATED)
def create_subscription(
    *,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    subscription_in: SubscriptionCreate
) -> Any:
    """
    Create new subscription（新建返回 201；活跃重复订阅静默返回 200，防止邮件枚举）
    """
    # Check if user is already subscribed with the same email
    existing_subscription = db.query(SubscriptionModel).filter(
        SubscriptionModel.email == subscription_in.email
    ).first()
    if existing_subscription and existing_subscription.is_active:
        # 统一返回成功响应，防止邮件枚举；未验证的旧订阅补发验证邮件
        if not existing_subscription.is_verified:
            _queue_verification_email(background_tasks, existing_subscription)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=Subscription.model_validate(existing_subscription).model_dump(mode="json"),
        )

    subscription = crud.create_subscription(db, subscription=subscription_in)
    # 订阅创建（含取消后重新激活）成功后，后台发送验证邮件；
    # SMTP 未配置时 email_service 自行静默跳过，不影响订阅结果
    if not subscription.is_verified:
        _queue_verification_email(background_tasks, subscription)
    return subscription


def _queue_verification_email(background_tasks: BackgroundTasks, subscription: SubscriptionModel) -> None:
    """将订阅验证邮件加入后台任务（逐订阅者单独发送，To 只有一个收件人）"""
    if not subscription.verification_token:
        return
    background_tasks.add_task(
        email_service.send_verification_email,
        str(subscription.email),
        str(subscription.verification_token),
    )


@router.post("/verify", response_model=dict)
def verify_subscription(
    *,
    verification_in: SubscriptionVerification,
    db: Session = Depends(get_db)
) -> Any:
    """
    Verify subscription by token（订阅验证邮件中的链接回跳后由前端调用）
    """
    verified = crud.verify_subscription(db, token=verification_in.token)
    if not verified:
        # 令牌不存在或已被使用过
        raise BadRequestException(message="无效或已使用的验证令牌")
    return {"message": "邮箱验证成功"}


@router.post("/unsubscribe", response_model=dict)
def unsubscribe(
    email: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Unsubscribe by email
    """
    subscription = db.query(SubscriptionModel).filter(
        SubscriptionModel.email == email
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found for this email",
        )
    
    subscription.is_active = False
    db.commit()
    
    return {"message": "取消订阅成功"}


@router.get("/count", response_model=int)
def get_subscribers_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Get total number of subscribers
    """
    count = crud.get_subscribers_count(db)
    return count


@router.get("/{subscription_id}", response_model=Subscription)
def read_subscription_by_id(
    subscription_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Get a specific subscription by id
    """
    from uuid import UUID
    try:
        subscription_uuid = UUID(subscription_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subscription ID format",
        )
    
    subscription = crud.get_subscription(db, subscription_id=subscription_uuid)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )
    
    return subscription


@router.put("/{subscription_id}", response_model=Subscription)
def update_subscription(
    *,
    db: Session = Depends(get_db),
    subscription_id: str,
    subscription_in: SubscriptionUpdate,
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Update a subscription
    """
    from uuid import UUID
    try:
        subscription_uuid = UUID(subscription_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subscription ID format",
        )
    
    subscription = crud.get_subscription(db, subscription_id=subscription_uuid)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )
    
    subscription = crud.update_subscription(
        db, 
        subscription_id=subscription_uuid, 
        **subscription_in.model_dump(exclude_unset=True)
    )
    return subscription


@router.delete("/{subscription_id}", response_model=dict)
def delete_subscription(
    *,
    db: Session = Depends(get_db),
    subscription_id: str,
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Delete a subscription
    """
    from uuid import UUID
    try:
        subscription_uuid = UUID(subscription_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subscription ID format",
        )
    
    subscription = crud.get_subscription(db, subscription_id=subscription_uuid)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )
    
    deleted = crud.delete_subscription(db, subscription_id=subscription_uuid)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )
    
    return {"message": "Subscription deleted successfully"}