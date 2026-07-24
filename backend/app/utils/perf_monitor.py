"""API性能监控工具"""

import time
import functools
from typing import Callable, Any
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.logger import log_performance, log_api_call, app_logger
from app.services.cache_service import cache_service
from app.core.config import settings
import asyncio

# 信号量限制并发异步日志任务数，防止资源耗尽
MAX_CONCURRENT_TASKS = 100
_log_task_semaphore = asyncio.Semaphore(MAX_CONCURRENT_TASKS)


async def _log_with_semaphore(log_func, *args, **kwargs):
    """使用信号量包装日志任务，限制并发数"""
    try:
        async with _log_task_semaphore:
            # 检查是否为异步函数
            if asyncio.iscoroutinefunction(log_func):
                await log_func(*args, **kwargs)
            else:
                # 同步函数直接调用，不使用 await
                log_func(*args, **kwargs)
    except Exception as e:
        # 日志记录失败不应该影响主流程
        app_logger.error(f"Failed to log performance metrics: {str(e)}")


def monitor_api_performance(func: Callable) -> Callable:
    """
    装饰器：监控API端点的性能
    """
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        
        # 获取request对象以获取用户和IP信息
        request = None
        for arg in args:
            if isinstance(arg, Request):
                request = arg
                break
        
        user_id = "anonymous"
        ip_address = "unknown"
        
        if request:
            # 尝试从请求中获取用户信息
            if hasattr(request.state, 'current_user') and request.state.current_user:
                user_id = str(request.state.current_user.id)
            ip_address = request.client.host if request.client else "unknown"
        
        try:
            result = await func(*args, **kwargs)
            status_code = 200  # 假设成功
        except Exception as e:
            status_code = getattr(e, 'status_code', 500)
            raise
        finally:
            duration = (time.time() - start_time) * 1000  # 转换为毫秒
            
            # 记录性能指标（使用信号量限制并发）
            endpoint = f"{request.method} {request.url.path}" if request else func.__name__
            asyncio.create_task(
                _log_with_semaphore(
                    log_performance,
                    endpoint=endpoint,
                    duration_ms=duration,
                    request_id=getattr(request.state, 'request_id', None) if request else None,
                    user_id=user_id
                )
            )
            
            # 记录API调用（使用信号量限制并发）
            if request:
                asyncio.create_task(
                    _log_with_semaphore(
                        log_api_call,
                        endpoint=request.url.path,
                        method=request.method,
                        status_code=status_code,
                        user_id=user_id,
                        ip_address=ip_address,
                        duration_ms=duration
                    )
                )
        
        return result
    return wrapper


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """
    性能监控中间件，记录每个请求的处理时间和相关信息
    """
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # 获取用户信息
        user_id = "anonymous"
        if hasattr(request.state, 'current_user') and request.state.current_user:
            user_id = str(request.state.current_user.id)
        
        ip_address = request.client.host if request.client else "unknown"
        
        try:
            response = await call_next(request)
        except Exception as e:
            response = JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )
            raise
        finally:
            duration = (time.time() - start_time) * 1000  # 转换为毫秒
            
            # 记录性能指标（使用信号量限制并发）
            asyncio.create_task(
                _log_with_semaphore(
                    log_performance,
                    endpoint=f"{request.method} {request.url.path}",
                    duration_ms=duration,
                    request_id=getattr(request.state, 'request_id', None),
                    user_id=user_id
                )
            )
            
            # 记录API调用（使用信号量限制并发）
            asyncio.create_task(
                _log_with_semaphore(
                    log_api_call,
                    endpoint=request.url.path,
                    method=request.method,
                    status_code=response.status_code,
                    user_id=user_id,
                    ip_address=ip_address,
                    duration_ms=duration
                )
            )
        
        return response


def track_cache_hits(func: Callable) -> Callable:
    """
    装饰器：跟踪缓存命中率
    """
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        # 在函数名中添加缓存统计前缀
        cache_key_prefix = f"cache_stats:{func.__name__}"
        
        # 获取之前的统计信息
        stats = await cache_service.get(cache_key_prefix) or {
            'total_calls': 0,
            'cache_hits': 0,
            'hit_rate': 0.0
        }
        
        stats['total_calls'] += 1
        
        # 检查是否涉及缓存操作（通过检查函数名或参数）
        # 这里简化处理，实际应用中可以根据具体情况进行调整
        is_cache_operation = 'cache' in func.__name__.lower() or 'get_' in func.__name__.lower()
        
        if is_cache_operation:
            # 假设这是一个缓存获取操作，检查返回值是否来自缓存
            # 这里需要根据实际业务逻辑调整
            result = await func(*args, **kwargs)
            
            # 更新缓存命中率
            if result is not None:  # 假设非None值表示缓存命中
                stats['cache_hits'] += 1
                stats['hit_rate'] = stats['cache_hits'] / stats['total_calls']
            
            # 存储更新后的统计信息
            await cache_service.set(cache_key_prefix, stats, expire=3600)
            
            return result
        else:
            # 非缓存操作，直接执行
            result = await func(*args, **kwargs)
            
            # 更新统计信息
            stats['hit_rate'] = stats['cache_hits'] / stats['total_calls'] if stats['total_calls'] > 0 else 0.0
            await cache_service.set(cache_key_prefix, stats, expire=3600)
            
            return result
    
    return wrapper


def log_slow_queries(threshold_ms: float = 1000.0):
    """
    装饰器：记录慢查询
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            result = await func(*args, **kwargs)
            duration = (time.time() - start_time) * 1000  # 转换为毫秒
            
            if duration > threshold_ms:
                # 记录慢查询
                app_logger.warning(
                    f"SLOW QUERY detected in {func.__name__}: {duration:.2f}ms\n"
                    f"Args: {args}\nKwargs: {kwargs}"
                )
            
            return result
        return wrapper
    return decorator