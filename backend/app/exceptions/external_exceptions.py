"""
External Service Exceptions
外部服务调用相关的异常
"""

from typing import Optional, Any
from .base import AppException, ErrorCode


class ExternalServiceException(AppException):
    """
    外部服务异常基类
    调用外部服务时发生的错误
    """
    
    def __init__(
        self,
        service_name: str,
        message: str = "External service error",
        status_code: int = 502,
        code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
        original_error: Optional[Exception] = None,
    ):
        self.service_name = service_name
        self.original_error = original_error
        
        full_message = f"{service_name}: {message}"
        if original_error:
            full_message += f" (Original: {str(original_error)})"
        
        super().__init__(
            code=code,
            message=full_message,
            status_code=status_code,
        )


class LLMServiceException(ExternalServiceException):
    """
    LLM 服务异常
    调用 LLM API 时发生的错误
    """
    
    def __init__(
        self,
        provider: str,
        message: str = "LLM service error",
        status_code: int = 502,
        original_error: Optional[Exception] = None,
        response_data: Optional[Any] = None,
    ):
        self.provider = provider
        self.response_data = response_data
        
        super().__init__(
            service_name=f"LLM Provider ({provider})",
            message=message,
            status_code=status_code,
            code=ErrorCode.LLM_SERVICE_ERROR,
            original_error=original_error,
        )


class DatabaseException(ExternalServiceException):
    """
    数据库异常
    数据库操作错误
    """
    
    def __init__(
        self,
        message: str = "Database error",
        operation: Optional[str] = None,
        original_error: Optional[Exception] = None,
    ):
        self.operation = operation
        
        if operation:
            message = f"Database error during {operation}: {message}"
        
        super().__init__(
            service_name="Database",
            message=message,
            status_code=500,
            code=ErrorCode.DATABASE_ERROR,
            original_error=original_error,
        )


class CacheException(ExternalServiceException):
    """
    缓存服务异常
    Redis 等缓存服务错误
    """
    
    def __init__(
        self,
        message: str = "Cache service error",
        operation: Optional[str] = None,
        original_error: Optional[Exception] = None,
    ):
        self.operation = operation
        
        if operation:
            message = f"Cache error during {operation}: {message}"
        
        super().__init__(
            service_name="Cache",
            message=message,
            status_code=500,
            code=ErrorCode.CACHE_ERROR,
            original_error=original_error,
        )


class ThirdPartyAPIException(ExternalServiceException):
    """
    第三方 API 异常
    调用外部 API 时发生的错误
    """
    
    def __init__(
        self,
        api_name: str,
        message: str = "Third-party API error",
        status_code: int = 502,
        api_status_code: Optional[int] = None,
        original_error: Optional[Exception] = None,
        response_data: Optional[Any] = None,
    ):
        self.api_name = api_name
        self.api_status_code = api_status_code
        self.response_data = response_data
        
        full_message = message
        if api_status_code:
            full_message += f" (API status: {api_status_code})"
        
        super().__init__(
            service_name=api_name,
            message=full_message,
            status_code=status_code,
            code=ErrorCode.THIRD_PARTY_API_ERROR,
            original_error=original_error,
        )


class EmbeddingServiceException(ExternalServiceException):
    """
    嵌入向量服务异常
    调用文本向量化服务时发生的错误
    """
    
    def __init__(
        self,
        provider: str = "OpenAI",
        message: str = "Embedding service error",
        original_error: Optional[Exception] = None,
    ):
        super().__init__(
            service_name=f"Embedding Provider ({provider})",
            message=message,
            status_code=502,
            code=ErrorCode.LLM_SERVICE_ERROR,
            original_error=original_error,
        )


class VectorDBException(ExternalServiceException):
    """
    向量数据库异常
    向量搜索和存储相关错误
    """
    
    def __init__(
        self,
        message: str = "Vector database error",
        operation: Optional[str] = None,
        original_error: Optional[Exception] = None,
    ):
        self.operation = operation
        
        if operation:
            message = f"Vector DB error during {operation}: {message}"
        
        super().__init__(
            service_name="VectorDB",
            message=message,
            status_code=500,
            code=ErrorCode.DATABASE_ERROR,
            original_error=original_error,
        )
