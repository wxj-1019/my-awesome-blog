"""健康检查和监控功能"""

import asyncio
import time
import psutil
from typing import Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_superuser
from app.models.user import User
from app.services.cache_service import cache_service
from app.utils.logger import app_logger
from app.utils.middleware import get_active_requests, get_request_metrics
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
async def health_check(db: Session = Depends(get_db)):
    """健康检查端点"""
    uptime = time.time() - start_time

    # 执行各项检查
    checks = {}

    # 数据库连接检查
    try:
        await asyncio.to_thread(db.execute, text("SELECT 1"))
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
            gpus = await asyncio.to_thread(GPUtil.getGPUs)
            gpu_usage_percent = gpus[0].load * 100 if gpus else 0.0
        except Exception as exc:
            app_logger.warning(f"获取 GPU 信息失败: {exc}")
            gpu_usage_percent = 0.0

    # 活跃连接数：来自请求中间件统计的正在处理的请求数
    active_connections = get_active_requests()

    # 缓存命中率与响应时间：来自 Redis INFO 统计与 ping 实测
    cache_hit_ratio = 0.0
    response_time_ms = 0.0
    if cache_service.redis:
        try:
            info = await cache_service.redis.info("stats")
            hits = int(info.get("keyspace_hits", 0))
            misses = int(info.get("keyspace_misses", 0))
            total = hits + misses
            cache_hit_ratio = hits / total if total > 0 else 0.0

            ping_start = time.time()
            await cache_service.redis.ping()
            response_time_ms = (time.time() - ping_start) * 1000
        except Exception as exc:
            app_logger.warning(f"获取 Redis 统计信息失败: {exc}")
    
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """获取应用分析数据（请求指标来自进程内统计，重启后归零）"""
    from sqlalchemy import func as sql_func
    from app.models.user import User

    analytics_data = get_request_metrics()

    # 活跃用户数：数据库中已激活用户
    analytics_data["active_users"] = db.query(sql_func.count(User.id)).filter(
        User.is_active == True
    ).scalar() or 0

    # 缓存键数量：Redis dbsize
    cache_size = 0
    if cache_service.redis:
        try:
            cache_size = await cache_service.redis.dbsize()
        except Exception as exc:
            app_logger.warning(f"获取 Redis 缓存大小失败: {exc}")
    analytics_data["cache_size"] = cache_size

    return analytics_data