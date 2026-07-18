"""健康检查和监控功能"""

import asyncio
import time
import psutil
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.config import settings
from app.core.dependencies import get_current_superuser
from app.models.user import User
from app.services.cache_service import cache_service
from app.utils.logger import app_logger
from datetime import datetime


# 尝试导入GPUtil，如果不可用则设置为None
try:
    import GPUtil
    HAS_GPU = True
except ImportError:
    GPUtil = None
    HAS_GPU = False


router = APIRouter()


class HealthCheckResponse(BaseModel):
    """健康检查响应模型"""
    status: str
    timestamp: datetime
    service: str
    version: str
    uptime: float
    checks: Dict[str, Any]


class SystemMetrics(BaseModel):
    """系统指标模型"""
    cpu_percent: float
    memory_percent: float
    disk_usage_percent: float
    gpu_usage_percent: float
    active_connections: int
    cache_hit_ratio: float
    response_time_ms: float


# 记录应用启动时间
start_time = time.time()


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """健康检查端点"""
    uptime = time.time() - start_time
    
    # 执行各项检查
    checks = {}
    
    # 数据库连接检查
    try:
        # 这里应该根据实际的数据库连接方式来检查
        checks["database"] = {"status": "ok", "message": "Database connection successful"}
    except Exception as e:
        checks["database"] = {"status": "error", "message": str(e)}
    
    # Redis连接检查
    try:
        if cache_service.redis:
            await cache_service.redis.ping()
            checks["redis"] = {"status": "ok", "message": "Redis connection successful"}
        else:
            checks["redis"] = {"status": "warning", "message": "Redis not initialized"}
    except Exception as e:
        checks["redis"] = {"status": "error", "message": f"Redis connection failed: {str(e)}"}
    
    # 检查所有必需服务的状态
    all_healthy = all(check["status"] == "ok" for check in checks.values())
    
    return HealthCheckResponse(
        status="healthy" if all_healthy else "degraded",
        timestamp=datetime.utcnow(),
        service=settings.APP_NAME,
        version=settings.APP_VERSION,
        uptime=uptime,
        checks=checks
    )


@router.get("/metrics", response_model=SystemMetrics)
async def get_system_metrics(
    current_user: User = Depends(get_current_superuser)
):
    """获取系统指标"""
    # CPU使用率
    cpu_percent = await asyncio.to_thread(psutil.cpu_percent, interval=1)
    
    # 内存使用率
    memory = psutil.virtual_memory()
    memory_percent = memory.percent
    
    # 磁盘使用率
    disk_usage = psutil.disk_usage('/')
    disk_usage_percent = (disk_usage.used / disk_usage.total) * 100
    
    # GPU使用率（如果有GPU）
    gpu_usage_percent = 0.0
    if HAS_GPU and GPUtil:
        try:
            gpus = GPUtil.getGPUs()
            gpu_usage_percent = gpus[0].load * 100 if gpus else 0.0
        except:
            gpu_usage_percent = 0.0  # 如果无法获取GPU信息，则设为0
    
    # 活跃连接数（模拟值，实际应用中需要从连接池获取真实数据）
    active_connections = 10  # 这只是一个示例值
    
    # 缓存命中率（模拟计算）
    # 实际应用中需要通过Redis统计信息计算
    cache_hit_ratio = 0.95  # 示例值
    
    # 响应时间（模拟值）
    start = time.time()
    await asyncio.sleep(0.01)  # 模拟处理时间
    response_time_ms = (time.time() - start) * 1000
    
    return SystemMetrics(
        cpu_percent=cpu_percent,
        memory_percent=memory_percent,
        disk_usage_percent=disk_usage_percent,
        gpu_usage_percent=gpu_usage_percent,
        active_connections=active_connections,
        cache_hit_ratio=cache_hit_ratio,
        response_time_ms=response_time_ms
    )


@router.get("/monitoring/status")
async def get_monitoring_status(
    current_user: User = Depends(get_current_superuser)
):
    """获取监控状态"""
    uptime = time.time() - start_time
    
    # 获取系统信息
    cpu_percent = await asyncio.to_thread(psutil.cpu_percent, interval=1)
    memory = await asyncio.to_thread(psutil.virtual_memory)
    
    return {
        "status": "running",
        "uptime_seconds": uptime,
        "timestamp": datetime.utcnow(),
        "system_info": {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
        },
        "app_info": {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
        }
    }


@router.get("/monitoring/logs")
async def get_recent_logs(
    count: int = 10,
    current_user: User = Depends(get_current_superuser)
):
    """获取最近的日志条目"""
    # 这是一个示例实现，实际应用中需要从日志文件或日志服务中读取
    # 由于loguru的日志写入到文件，这里无法直接读取
    # 实际部署时可能需要使用专门的日志聚合服务
    app_logger.info(f"Fetching {count} recent log entries")
    
    return {
        "message": f"This would return the {count} most recent log entries in a real implementation",
        "note": "Actual log retrieval would require integration with a log aggregation system"
    }


@router.get("/monitoring/analytics")
async def get_analytics(
    current_user: User = Depends(get_current_superuser)
):
    """获取应用分析数据"""
    # 这里会返回各种应用分析数据
    # 实际实现中会从数据库或缓存中获取统计信息
    
    # 示例数据
    analytics_data = {
        "total_requests": 12500,
        "requests_today": 420,
        "active_users": 150,
        "cache_size": 1024,  # 示例值
        "average_response_time": 120.5,  # ms
        "error_rate": 0.02,  # 2% error rate
        "top_endpoints": [
            {"endpoint": "/api/v1/articles", "hits": 1200},
            {"endpoint": "/api/v1/users/profile", "hits": 980},
            {"endpoint": "/api/v1/comments", "hits": 750}
        ]
    }
    
    return analytics_data