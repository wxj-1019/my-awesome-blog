from typing import Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
from app.core import security
from app.core.database import get_db
from app import crud
import app.models  # Import all models to ensure proper initialization
from app.models.user import User
from app.services.cache_service import cache_service
from app.utils.logger import app_logger

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    app_logger.debug(f"Authentication attempt with token: {token[:20]}...")
    
    # 检查令牌是否在黑名单中
    try:
        is_blacklisted = await cache_service.exists(f"blacklist:token:{token}")
        if is_blacklisted:
            app_logger.warning(f"Attempt to use blacklisted token: {token[:20]}...")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e:
        # 如果缓存服务出错，记录但不阻止认证（降级处理）
        app_logger.error(f"Error checking token blacklist: {str(e)}")
    
    try:
        app_logger.debug("Verifying token...")
        payload = security.verify_token(token)
        if payload is None:
            app_logger.warning("Token verification failed: payload is None")
            raise credentials_exception
        
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            app_logger.warning("Token payload missing 'sub' field")
            raise credentials_exception
        
        app_logger.debug(f"Token verified successfully, user_id: {user_id}")
    except JWTError as e:
        app_logger.error(f"JWT decode error: {e}, token: {token[:20]}...")
        raise credentials_exception
    except Exception as e:
        app_logger.error(f"Unexpected error during token verification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while validating credentials"
        )
    
    try:
        app_logger.debug(f"Fetching user from database: {user_id}")
        user = crud.get_user(db, user_id=UUID(user_id))
        if user is None:
            app_logger.warning(f"User not found for ID: {user_id}")
            raise credentials_exception
        
        app_logger.debug(f"User found: {user.username} (ID: {user_id})")
    except ValueError as e:
        app_logger.error(f"Invalid user_id format: {user_id}, error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format"
        )
    except Exception as e:
        app_logger.error(f"Database error while fetching user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while fetching user"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_active_user)
) -> User:
    if not current_user.is_superuser:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user