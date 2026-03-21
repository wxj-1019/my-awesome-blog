"""
HTTP Exceptions
对应 HTTP 状态码的异常类
"""

from typing import Optional, List
from .base import AppException, ErrorCode, ErrorDetail


class BadRequestException(AppException):
    """
    400 Bad Request
    请求参数错误或不完整
    """
    
    def __init__(
        self,
        message: str = "Bad request",
        details: Optional[List[ErrorDetail]] = None,
    ):
        super().__init__(
            code=ErrorCode.BAD_REQUEST,
            message=message,
            status_code=400,
            details=details,
        )


class UnauthorizedException(AppException):
    """
    401 Unauthorized
    未提供认证信息或认证失败
    """
    
    def __init__(
        self,
        message: str = "Authentication required",
        authenticate_header: Optional[str] = None,
    ):
        headers = {}
        if authenticate_header:
            headers["WWW-Authenticate"] = authenticate_header
        
        super().__init__(
            code=ErrorCode.UNAUTHORIZED,
            message=message,
            status_code=401,
            headers=headers,
        )


class ForbiddenException(AppException):
    """
    403 Forbidden
    权限不足，禁止访问
    """
    
    def __init__(
        self,
        message: str = "Access denied",
        resource: Optional[str] = None,
        action: Optional[str] = None,
    ):
        if resource and action:
            message = f"You don't have permission to {action} {resource}"
        
        super().__init__(
            code=ErrorCode.FORBIDDEN,
            message=message,
            status_code=403,
        )


class NotFoundException(AppException):
    """
    404 Not Found
    资源不存在
    """
    
    def __init__(
        self,
        resource: Optional[str] = None,
        identifier: Optional[str] = None,
        message: Optional[str] = None,
    ):
        if message is None:
            if resource and identifier:
                message = f"{resource} with id '{identifier}' not found"
            elif resource:
                message = f"{resource} not found"
            else:
                message = "Resource not found"
        
        super().__init__(
            code=ErrorCode.NOT_FOUND,
            message=message,
            status_code=404,
        )


class ConflictException(AppException):
    """
    409 Conflict
    资源冲突，如重复创建
    """
    
    def __init__(
        self,
        message: str = "Resource conflict",
        resource: Optional[str] = None,
        field: Optional[str] = None,
    ):
        if resource and field:
            message = f"{resource} with this {field} already exists"
        
        super().__init__(
            code=ErrorCode.CONFLICT,
            message=message,
            status_code=409,
        )


class UnprocessableException(AppException):
    """
    422 Unprocessable Entity
    请求格式正确但语义错误，无法处理
    """
    
    def __init__(
        self,
        message: str = "Validation failed",
        details: Optional[List[ErrorDetail]] = None,
    ):
        super().__init__(
            code=ErrorCode.UNPROCESSABLE_ENTITY,
            message=message,
            status_code=422,
            details=details,
        )


class TooManyRequestsException(AppException):
    """
    429 Too Many Requests
    请求过于频繁，触发限流
    """
    
    def __init__(
        self,
        message: str = "Too many requests",
        retry_after: Optional[int] = None,
    ):
        headers = {}
        if retry_after:
            headers["Retry-After"] = str(retry_after)
        
        super().__init__(
            code=ErrorCode.TOO_MANY_REQUESTS,
            message=message,
            status_code=429,
            headers=headers,
        )


class InternalServerException(AppException):
    """
    500 Internal Server Error
    服务器内部错误
    """
    
    def __init__(
        self,
        message: str = "Internal server error",
    ):
        super().__init__(
            code=ErrorCode.INTERNAL_SERVER_ERROR,
            message=message,
            status_code=500,
        )


class ServiceUnavailableException(AppException):
    """
    503 Service Unavailable
    服务暂时不可用
    """
    
    def __init__(
        self,
        message: str = "Service temporarily unavailable",
        retry_after: Optional[int] = None,
    ):
        headers = {}
        if retry_after:
            headers["Retry-After"] = str(retry_after)
        
        super().__init__(
            code=ErrorCode.SERVICE_UNAVAILABLE,
            message=message,
            status_code=503,
            headers=headers,
        )
