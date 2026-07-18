"""
Exception Handlers
全局异常处理器 - 将自定义异常转换为 FastAPI 响应
"""

from fastapi import Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, NoResultFound
from redis.exceptions import RedisError
import httpx

from app.exceptions import (
    AppException,
    NotFoundException,
    ValidationException,
    ExternalServiceException,
)
from app.utils.logger import app_logger


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """
    处理所有自定义 AppException
    
    这是主要的异常处理器，所有继承自 AppException 的异常都会被这里处理
    """
    # 记录错误日志
    app_logger.error(
        f"AppException: {exc.code} - {exc.message}",
        extra={
            "status_code": exc.status_code,
            "path": request.url.path,
            "method": request.method,
            "details": exc.details,
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict(),
        headers=exc.headers,
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    处理请求参数验证错误
    
    处理 Pydantic 验证失败的情况
    """
    from app.exceptions.base import ErrorDetail
    
    # 转换 Pydantic 错误为统一格式
    details = []
    for error in exc.errors():
        field = ".".join(str(x) for x in error["loc"])
        details.append(ErrorDetail(
            field=field,
            message=error["msg"],
            code=error["type"].upper().replace(".", "_"),
        ))
    
    app_logger.warning(
        f"Validation error: {len(details)} field(s) invalid",
        extra={"path": request.url.path, "method": request.method}
    )
    
    response = {
        "error": {
            "code": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "status_code": 422,
            "details": [d.to_dict() for d in details],
        }
    }
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=response,
    )


async def sqlalchemy_exception_handler(
    request: Request, exc: SQLAlchemyError
) -> JSONResponse:
    """
    处理数据库操作错误
    """
    from app.exceptions import DatabaseException
    
    # 根据具体错误类型转换
    if isinstance(exc, IntegrityError):
        message = "Database integrity error - possible duplicate or constraint violation"
        status_code = 409
        code = "DATABASE_INTEGRITY_ERROR"
    elif isinstance(exc, NoResultFound):
        message = "Requested resource not found in database"
        status_code = 404
        code = "RESOURCE_NOT_FOUND"
    else:
        message = "Database operation failed"
        status_code = 500
        code = "DATABASE_ERROR"
    
    app_logger.error(
        f"Database error: {exc}",
        extra={"path": request.url.path, "method": request.method},
        exc_info=True,
    )
    
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "status_code": status_code,
            }
        },
    )


async def redis_exception_handler(
    request: Request, exc: RedisError
) -> JSONResponse:
    """
    处理 Redis 缓存错误
    """
    app_logger.error(
        f"Redis error: {exc}",
        extra={"path": request.url.path, "method": request.method},
        exc_info=True,
    )
    
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "error": {
                "code": "CACHE_ERROR",
                "message": "Cache service temporarily unavailable",
                "status_code": 503,
            }
        },
    )


async def httpx_exception_handler(
    request: Request, exc: httpx.HTTPError
) -> JSONResponse:
    """
    处理 HTTP 客户端错误（通常是调用外部 API 失败）
    """
    from app.exceptions import ThirdPartyAPIException
    
    app_logger.error(
        f"External API error: {exc}",
        extra={"path": request.url.path, "method": request.method},
        exc_info=True,
    )
    
    return JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content={
            "error": {
                "code": "EXTERNAL_API_ERROR",
                "message": "External service temporarily unavailable",
                "status_code": 502,
            }
        },
    )


async def generic_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """
    处理所有未捕获的异常
    
    作为最后的防线，防止未处理的异常暴露敏感信息
    """
    app_logger.critical(
        f"Unhandled exception: {exc}",
        extra={"path": request.url.path, "method": request.method},
        exc_info=True,
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                "status_code": 500,
            }
        },
    )


async def value_error_handler(
    request: Request, exc: ValueError
) -> JSONResponse:
    """
    处理值错误，如无效的 UUID 格式
    """
    app_logger.warning(
        f"ValueError: {exc}",
        extra={"path": request.url.path, "method": request.method},
    )
    
    error_message = str(exc)
    if "UUID" in error_message or "uuid" in error_message.lower():
        error_message = "Invalid UUID format"
    
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": "INVALID_VALUE",
                "message": error_message,
                "status_code": 400,
            }
        },
    )


async def http_exception_handler(
    request: Request, exc: HTTPException
) -> JSONResponse:
    """
    处理 FastAPI HTTPException
    """
    app_logger.warning(
        f"HTTPException: {exc.status_code} - {exc.detail}",
        extra={"path": request.url.path, "method": request.method},
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
                "status_code": exc.status_code,
            }
        },
        headers=getattr(exc, "headers", None) or {},
    )


async def starlette_http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """
    处理 Starlette HTTPException
    """
    app_logger.warning(
        f"StarletteHTTPException: {exc.status_code} - {exc.detail}",
        extra={"path": request.url.path, "method": request.method},
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
                "status_code": exc.status_code,
            }
        },
    )


def register_exception_handlers(app):
    """
    注册所有异常处理器到 FastAPI 应用
    
    Usage:
        from fastapi import FastAPI
        from app.core.exception_handlers import register_exception_handlers
        
        app = FastAPI()
        register_exception_handlers(app)
    """
    # FastAPI HTTPException
    app.add_exception_handler(HTTPException, http_exception_handler)
    
    # Starlette HTTPException
    app.add_exception_handler(StarletteHTTPException, starlette_http_exception_handler)
    
    # 自定义异常
    app.add_exception_handler(AppException, app_exception_handler)
    
    # FastAPI 内置验证异常
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    
    # ValueError（如无效 UUID）
    app.add_exception_handler(ValueError, value_error_handler)
    
    # 数据库异常
    app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
    
    # 缓存异常
    app.add_exception_handler(RedisError, redis_exception_handler)
    
    # HTTP 客户端异常
    app.add_exception_handler(httpx.HTTPError, httpx_exception_handler)
    
    # 通用异常处理器（最后注册，优先级最低）
    app.add_exception_handler(Exception, generic_exception_handler)
    
    app_logger.info("Exception handlers registered")
