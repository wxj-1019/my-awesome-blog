import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from app.core.config import settings
from app.utils.logger import app_logger


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """创建JWT访问令牌"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """验证JWT令牌"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def _verify_password_sync(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


async def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    验证密码（异步，在线程池中执行 bcrypt 以避免阻塞事件循环）
    """
    try:
        return await asyncio.get_event_loop().run_in_executor(
            None, _verify_password_sync, plain_password, hashed_password
        )
    except ValueError as e:
        app_logger.error(f"Password verification error: {str(e)}")
        return False


def _get_password_hash_sync(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


async def get_password_hash(password: str) -> str:
    """
    生成密码哈希（异步，在线程池中执行 bcrypt 以避免阻塞事件循环）
    """
    return await asyncio.get_event_loop().run_in_executor(
        None, _get_password_hash_sync, password
    )
