"""
Exceptions Module
统一异常处理体系

使用示例:
    from app.exceptions import NotFoundException, ValidationException
    
    raise NotFoundException("User", user_id)
    raise ValidationException("Email format is invalid")
"""

from .base import (
    AppException,
    ErrorCode,
    ErrorDetail,
)
from .http_exceptions import (
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
    ConflictException,
    UnprocessableException,
    TooManyRequestsException,
    InternalServerException,
    ServiceUnavailableException,
)
from .business_exceptions import (
    BusinessException,
    ValidationException,
    ResourceNotFoundException,
    DuplicateResourceException,
    InsufficientPermissionException,
    OperationNotAllowedException,
    ResourceExpiredException,
)
from .external_exceptions import (
    ExternalServiceException,
    LLMServiceException,
    DatabaseException,
    CacheException,
    ThirdPartyAPIException,
)

__all__ = [
    # 基础
    'AppException',
    'ErrorCode',
    'ErrorDetail',
    
    # HTTP 异常
    'BadRequestException',
    'UnauthorizedException',
    'ForbiddenException',
    'NotFoundException',
    'ConflictException',
    'UnprocessableException',
    'TooManyRequestsException',
    'InternalServerException',
    'ServiceUnavailableException',
    
    # 业务异常
    'BusinessException',
    'ValidationException',
    'ResourceNotFoundException',
    'DuplicateResourceException',
    'InsufficientPermissionException',
    'OperationNotAllowedException',
    'ResourceExpiredException',
    
    # 外部服务异常
    'ExternalServiceException',
    'LLMServiceException',
    'DatabaseException',
    'CacheException',
    'ThirdPartyAPIException',
]
