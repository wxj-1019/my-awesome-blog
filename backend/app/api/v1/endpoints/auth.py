from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app import crud
from app.schemas.token import Token, LoginRequest
from app.schemas.user import UserCreate, User as UserSchema
from app.models.user import User
from app.utils.rate_limit import login_rate_limit, register_rate_limit
from app.services.cache_service import cache_service
from app.utils.logger import app_logger

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


@router.post("/login", response_model=Token)
@login_rate_limit
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        app_logger.warning(f"Failed login attempt for username: {form_data.username} from IP: {request.client.host if request.client else 'unknown'}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": str(user.id), "username": user.username},
        expires_delta=access_token_expires,
    )

    app_logger.info(f"User logged in: {user.username} (ID: {user.id})")
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login-json", response_model=Token)
@login_rate_limit
async def login_json(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    JSON login endpoint (alternative to OAuth2 form)
    """
    user = crud.authenticate_user(db, login_data.username, login_data.password)
    if not user:
        app_logger.warning(f"Failed login attempt for username: {login_data.username} from IP: {request.client.host if request.client else 'unknown'}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": str(user.id), "username": user.username},
        expires_delta=access_token_expires,
    )

    app_logger.info(f"User logged in via JSON: {user.username} (ID: {user.id})")
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=dict)
@register_rate_limit
async def register(
    request: Request,
    user_in: UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    Create new user
    """
    # Check if user exists
    user = crud.get_user_by_username(db, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists",
        )

    user = crud.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    # Create user
    user = crud.create_user(db, user_in)
    app_logger.info(f"New user registered: {user.username} (ID: {user.id}) from IP: {request.client.host if request.client else 'unknown'}")

    return {"message": "User created successfully", "user_id": str(user.id)}


@router.post("/logout", response_model=dict)
async def logout(
    request: Request,
    token: str = Depends(oauth2_scheme),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Logout user and invalidate token
    将当前令牌添加到黑名单
    """
    try:
        # 计算令牌剩余有效期
        payload = security.verify_token(token)
        if payload:
            # 获取令牌过期时间
            exp = payload.get("exp")
            if exp:
                import time
                remaining_time = int(exp - time.time())
                if remaining_time > 0:
                    # 将令牌添加到黑名单，TTL设置为剩余有效期
                    await cache_service.set(
                        f"blacklist:token:{token}",
                        "1",
                        expire=remaining_time
                    )
                    app_logger.info(f"User logged out: {current_user.username} (ID: {current_user.id})")
        
        return {"message": "Successfully logged out"}
    except Exception as e:
        app_logger.error(f"Error during logout: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )


@router.get("/me", response_model=UserSchema)
async def read_users_me(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get current user information
    """
    return current_user
