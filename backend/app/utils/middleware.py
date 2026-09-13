import uuid
import time
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from loguru import logger
import traceback


# 当前正在处理的请求数（事件循环单线程，普通自增即可），供监控接口统计活跃连接
_active_requests = 0

# 进程内请求指标累计（供 /monitoring/analytics 使用；重启归零，属可接受精度）
_request_metrics = {
    "total": 0,
    "errors": 0,
    "durations_sum": 0.0,
    "durations_count": 0,
    "by_day": {},   # date_str -> count，仅保留最近几天
    "by_path": {},  # path -> count，容量有上限防止内存膨胀
}
_BY_PATH_MAX = 500


def get_active_requests() -> int:
    """获取当前正在处理的请求数。"""
    return _active_requests


def _get_metric_path(request: Request) -> str:
    """获取监控统计用路径。

    优先取路由模板（如 /api/v1/articles/{article_id}），
    避免带 UUID 的真实路径快速占满 by_path 的 500 容量上限，
    导致后续新端点永远不被统计；404 等未匹配路由时回退原始路径。
    """
    route = request.scope.get("route")
    path_format = getattr(route, "path_format", None)
    return path_format or request.url.path


def _record_request(path: str, status_code: int, duration: float) -> None:
    """累计请求指标（进程内内存统计）。"""
    from datetime import date

    m = _request_metrics
    m["total"] += 1
    if status_code >= 500:
        m["errors"] += 1
    m["durations_sum"] += duration
    m["durations_count"] += 1

    day = str(date.today())
    m["by_day"][day] = m["by_day"].get(day, 0) + 1
    # 仅保留最近 3 天，避免长期运行内存膨胀
    while len(m["by_day"]) > 3:
        oldest = min(m["by_day"])
        del m["by_day"][oldest]

    if len(m["by_path"]) < _BY_PATH_MAX or path in m["by_path"]:
        m["by_path"][path] = m["by_path"].get(path, 0) + 1


def get_request_metrics() -> dict:
    """获取累计请求指标快照。"""
    from datetime import date

    m = _request_metrics
    durations_count = m["durations_count"]
    return {
        "total_requests": m["total"],
        "requests_today": m["by_day"].get(str(date.today()), 0),
        "error_rate": (m["errors"] / m["total"]) if m["total"] > 0 else 0.0,
        "average_response_time": (m["durations_sum"] / durations_count * 1000) if durations_count > 0 else 0.0,
        "top_endpoints": [
            {"endpoint": path, "hits": hits}
            for path, hits in sorted(m["by_path"].items(), key=lambda kv: kv[1], reverse=True)[:5]
        ],
    }


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging requests with request ID tracking."""

    async def dispatch(self, request: Request, call_next: Callable):
        global _active_requests
        _active_requests += 1
        try:
            return await self._dispatch_inner(request, call_next)
        finally:
            _active_requests -= 1

    async def _dispatch_inner(self, request: Request, call_next: Callable):
        # Generate a unique request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Log request start
        start_time = time.time()
        logger.info(f"Request ID: {request_id} | {request.method} {request.url.path}")

        try:
            # Process the request
            response = await call_next(request)

            # Calculate processing time
            process_time = time.time() - start_time
            _record_request(_get_metric_path(request), response.status_code, process_time)

            # Log successful response
            logger.info(
                f"Request ID: {request_id} | "
                f"Status: {response.status_code} | "
                f"Duration: {process_time:.4f}s | "
                f"Path: {request.url.path}"
            )
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = str(process_time)
            
            return response
            
        except StarletteHTTPException as exc:
            # Handle HTTP exceptions
            process_time = time.time() - start_time
            _record_request(_get_metric_path(request), exc.status_code, process_time)
            logger.warning(
                f"Request ID: {request_id} | "
                f"HTTP Exception: {exc.status_code} | "
                f"Duration: {process_time:.4f}s | "
                f"Path: {request.url.path}"
            )
            
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
                headers={"X-Request-ID": request_id}
            )
        
        except Exception as exc:
            # Handle unexpected exceptions
            process_time = time.time() - start_time
            _record_request(_get_metric_path(request), 500, process_time)
            logger.error(
                f"Request ID: {request_id} | "
                f"Unexpected Error: {str(exc)} | "
                f"Duration: {process_time:.4f}s | "
                f"Path: {request.url.path} | "
                f"Traceback: {traceback.format_exc()}"
            )
            
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error",
                    "request_id": request_id
                },
                headers={"X-Request-ID": request_id}
            )


class RequestIDFilter:
    """Filter to add request ID to log records."""
    
    def __init__(self):
        self.current_request_id = None

    def filter_record(self, record):
        """Add request ID to log record if available in request state."""
        # This would be used when integrating with the request context
        record['extra']['request_id'] = getattr(self, 'current_request_id', 'N/A')
        return True


def get_request_id(request: Request) -> str:
    """Helper function to get request ID from request state."""
    return getattr(request.state, 'request_id', 'unknown')


__all__ = ["RequestLoggingMiddleware", "get_request_id"]