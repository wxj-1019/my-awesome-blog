import sys
import os
from contextlib import asynccontextmanager
# 添加backend目录到Python路径，以便可以直接运行此文件
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import settings
from app.utils.logger import app_logger
from app.utils.middleware import RequestLoggingMiddleware
from app.services.cache_service import cache_service
from app.utils.rate_limit import add_rate_limit_middleware
from app.utils.perf_monitor import PerformanceMonitoringMiddleware
from app.utils.api_docs import customize_openapi
from app.utils.config_validator import validate_and_log_config
from app.middleware.request_size_limit import RequestSizeLimitMiddleware
from app.services.weather_update_service import weather_update_service
from app.core.exception_handlers import register_exception_handlers

# Validate configuration on startup
validate_and_log_config()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理器 - 替代已弃用的 @app.on_event
    处理启动和关闭事件
    """
    # Startup
    app_logger.info("Application starting up...")
    
    app_logger.info("Connecting to Redis...")
    await cache_service.connect()
    
    app_logger.info("Starting weather update scheduler...")
    weather_update_service.start()
    await weather_update_service.initial_update()
    
    app_logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    app_logger.info("Application shutting down...")
    
    app_logger.info("Closing Redis connection...")
    await cache_service.close()
    
    app_logger.info("Stopping weather update scheduler...")
    weather_update_service.shutdown()
    
    app_logger.info("Application shutdown complete")


# Create FastAPI app with lifespan
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    openapi_url="/api/v1/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Customize API documentation
customize_openapi(app)

# Add custom middleware for request logging (放在最外层，确保所有请求都被记录)
app.add_middleware(RequestLoggingMiddleware)

# Add rate limiting middleware
add_rate_limit_middleware(app)

# Add performance monitoring middleware
app.add_middleware(PerformanceMonitoringMiddleware)

# Add request size limit middleware (防止大请求体DoS攻击)
app.add_middleware(RequestSizeLimitMiddleware)

# Set up CORS - 限制允许的HTTP方法和头部
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],  # 明确列出允许的HTTP方法
        allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],  # 限制允许的头部
        expose_headers=["X-Request-ID"],  # 暴露给客户端的头部
        max_age=600,  # 预检请求缓存时间（秒）
    )

# Include API router
app.include_router(api_router, prefix="/api/v1")

# Add exception handlers
register_exception_handlers(app)



# Health check endpoint
@app.get("/health")
async def health_check():
    app_logger.info("Health check endpoint accessed")
    return {"status": "healthy", "service": settings.APP_NAME}


@app.get("/")
async def root():
    app_logger.info("Root endpoint accessed")
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "openapi": "/api/v1/openapi.json"
    }


# 如果直接运行此文件，则启动服务器
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8989,
        reload=False,
        workers=1
    )