from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_superuser
from app import crud
from app.schemas.subscription import Subscription, SubscriptionCreate, SubscriptionUpdate
from app.models.subscription import Subscription as SubscriptionModel
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[Subscription])
def read_subscriptions(
    skip: int = 0,
    limit: int = 100,
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


@router.post("/", response_model=Subscription)
def create_subscription(
    *,
    db: Session = Depends(get_db),
    subscription_in: SubscriptionCreate
) -> Any:
    """
    Create new subscription
    """
    from app.models.subscription import Subscription as SubscriptionModel
    # Check if user is already subscribed with the same email
    existing_subscription = db.query(SubscriptionModel).filter(
        SubscriptionModel.email == subscription_in.email
    ).first()
    if existing_subscription:
        # 统一返回成功响应，防止邮件枚举
        return existing_subscription
    
    subscription = crud.create_subscription(db, subscription=subscription_in)
    return subscription


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