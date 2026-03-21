"""
Business Exceptions
业务逻辑相关的异常
"""

from typing import Optional
from .base import AppException, ErrorCode, ErrorDetail


class BusinessException(AppException):
    """
    通用业务异常
    用于表示业务规则冲突
    """
    
    def __init__(
        self,
        message: str = "Business rule violation",
        code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
        status_code: int = 400,
    ):
        super().__init__(
            code=code,
            message=message,
            status_code=status_code,
        )


class ValidationException(BusinessException):
    """
    数据验证异常
    请求数据不符合要求
    """
    
    def __init__(
        self,
        message: str = "Validation failed",
        field: Optional[str] = None,
        field_message: Optional[str] = None,
    ):
        details = None
        if field and field_message:
            details = [ErrorDetail(field=field, message=field_message, code="INVALID_VALUE")]
        
        super().__init__(
            message=message,
            code=ErrorCode.VALIDATION_ERROR,
            status_code=400,
        )
        if details:
            self.details = details


class ResourceNotFoundException(BusinessException):
    """
    资源不存在异常
    业务层面的资源查找失败
    """
    
    def __init__(
        self,
        resource_type: str,
        resource_id: Optional[str] = None,
        message: Optional[str] = None,
    ):
        if message is None:
            if resource_id:
                message = f"{resource_type} '{resource_id}' not found"
            else:
                message = f"{resource_type} not found"
        
        super().__init__(
            message=message,
            code=ErrorCode.RESOURCE_NOT_FOUND,
            status_code=404,
        )


class DuplicateResourceException(BusinessException):
    """
    资源重复异常
    创建已存在的资源
    """
    
    def __init__(
        self,
        resource_type: str,
        field: str,
        value: Optional[str] = None,
        message: Optional[str] = None,
    ):
        if message is None:
            if value:
                message = f"{resource_type} with {field} '{value}' already exists"
            else:
                message = f"{resource_type} with this {field} already exists"
        
        super().__init__(
            message=message,
            code=ErrorCode.DUPLICATE_RESOURCE,
            status_code=409,
        )


class InsufficientPermissionException(BusinessException):
    """
    权限不足异常
    用户没有执行操作所需的权限
    """
    
    def __init__(
        self,
        resource: Optional[str] = None,
        action: Optional[str] = None,
        message: Optional[str] = None,
    ):
        if message is None:
            if resource and action:
                message = f"You don't have permission to {action} this {resource}"
            elif action:
                message = f"You don't have permission to {action}"
            else:
                message = "Insufficient permission"
        
        super().__init__(
            message=message,
            code=ErrorCode.INSUFFICIENT_PERMISSION,
            status_code=403,
        )


class OperationNotAllowedException(BusinessException):
    """
    操作不允许异常
    当前状态下不允许执行的操作
    """
    
    def __init__(
        self,
        operation: str,
        reason: Optional[str] = None,
        message: Optional[str] = None,
    ):
        if message is None:
            message = f"Operation '{operation}' is not allowed"
            if reason:
                message += f": {reason}"
        
        super().__init__(
            message=message,
            code=ErrorCode.OPERATION_NOT_ALLOWED,
            status_code=400,
        )


class ResourceExpiredException(BusinessException):
    """
    资源过期异常
    资源已超过有效期
    """
    
    def __init__(
        self,
        resource_type: str,
        expired_at: Optional[str] = None,
        message: Optional[str] = None,
    ):
        if message is None:
            message = f"{resource_type} has expired"
            if expired_at:
                message += f" at {expired_at}"
        
        super().__init__(
            message=message,
            code=ErrorCode.RESOURCE_EXPIRED,
            status_code=410,  # Gone
        )
