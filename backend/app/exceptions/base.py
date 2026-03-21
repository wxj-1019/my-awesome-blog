"""
Base Exception Classes
所有自定义异常的基类
"""

from typing import Optional, Dict, Any, List
from enum import Enum
from dataclasses import dataclass


class ErrorCode(str, Enum):
    """
    错误代码枚举
    格式: 模块_具体错误
    """
    # 通用错误
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    NOT_IMPLEMENTED = "NOT_IMPLEMENTED"
    
    # HTTP 错误
    BAD_REQUEST = "BAD_REQUEST"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED"
    CONFLICT = "CONFLICT"
    UNPROCESSABLE_ENTITY = "UNPROCESSABLE_ENTITY"
    TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS"
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    
    # 业务错误
    VALIDATION_ERROR = "VALIDATION_ERROR"
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE"
    INSUFFICIENT_PERMISSION = "INSUFFICIENT_PERMISSION"
    OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED"
    RESOURCE_EXPIRED = "RESOURCE_EXPIRED"
    
    # 外部服务错误
    LLM_SERVICE_ERROR = "LLM_SERVICE_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    CACHE_ERROR = "CACHE_ERROR"
    THIRD_PARTY_API_ERROR = "THIRD_PARTY_API_ERROR"


@dataclass
class ErrorDetail:
    """
    错误详情数据结构
    
    Attributes:
        field: 出错的字段名（可选）
        message: 错误信息
        code: 错误代码
    """
    field: Optional[str]
    message: str
    code: str
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        result = {"message": self.message, "code": self.code}
        if self.field:
            result["field"] = self.field
        return result


class AppException(Exception):
    """
    应用基础异常类
    
    所有自定义异常的基类，提供统一的错误处理接口
    
    Attributes:
        code: 错误代码
        message: 错误信息
        status_code: HTTP 状态码
        details: 详细错误信息列表
        headers: 额外的 HTTP 响应头
    
    Example:
        raise AppException(
            code=ErrorCode.VALIDATION_ERROR,
            message="Validation failed",
            status_code=400,
            details=[
                ErrorDetail(field="email", message="Invalid email format", code="INVALID_EMAIL")
            ]
        )
    """
    
    def __init__(
        self,
        code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
        message: str = "An error occurred",
        status_code: int = 500,
        details: Optional[List[ErrorDetail]] = None,
        headers: Optional[Dict[str, str]] = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or []
        self.headers = headers or {}
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        """
        将异常转换为字典格式，用于 API 响应
        
        Returns:
            Dict: 包含错误信息的字典
        """
        result = {
            "error": {
                "code": self.code,
                "message": self.message,
                "status_code": self.status_code,
            }
        }
        
        if self.details:
            result["error"]["details"] = [detail.to_dict() for detail in self.details]
        
        return result
    
    def add_detail(self, detail: ErrorDetail) -> "AppException":
        """
        添加错误详情
        
        Args:
            detail: 错误详情对象
            
        Returns:
            self: 支持链式调用
        """
        self.details.append(detail)
        return self
    
    def with_header(self, key: str, value: str) -> "AppException":
        """
        添加响应头
        
        Args:
            key: 响应头名称
            value: 响应头值
            
        Returns:
            self: 支持链式调用
        """
        self.headers[key] = value
        return self


class ConfigurationError(AppException):
    """配置错误"""
    
    def __init__(self, message: str = "Configuration error"):
        super().__init__(
            code=ErrorCode.INTERNAL_ERROR,
            message=message,
            status_code=500,
        )


class NotImplementedException(AppException):
    """功能未实现"""
    
    def __init__(self, message: str = "This feature is not implemented"):
        super().__init__(
            code=ErrorCode.NOT_IMPLEMENTED,
            message=message,
            status_code=501,
        )
