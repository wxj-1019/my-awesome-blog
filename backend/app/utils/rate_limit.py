"""速率限制中间件和配置"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.utils.logger import app_logger


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["1000 per hour"]
)


async def _rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """处理速率限制超出异常"""
    app_logger.warning(f"Rate limit exceeded for IP: {get_remote_address(request)}, Path: {request.url.path}")
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "error": "RATE_LIMIT_EXCEEDED",
            "error_code": "RATE_LIMIT_EXCEEDED",
            "message": "请求过于频繁，请稍后再试",
            "details": {
                "path": str(request.url.path),
                "method": request.method
            }
        }
    )


def add_rate_limit_middleware(app: FastAPI):
    """为应用添加速率限制中间件"""
    # 注册限速器
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    
    # 添加自定义中间件来记录限速事件
    @app.middleware("http")
    async def rate_limit_middleware(request: Request, call_next):
        # 记录请求信息
        client_ip = get_remote_address(request)
        path = request.url.path
        method = request.method
        
        app_logger.info(f"Rate limit check for IP: {client_ip}, Path: {path}, Method: {method}")
        
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            app_logger.error(f"Rate limit middleware error: {str(e)}")
            raise


def get_rate_limit_for_endpoint(endpoint_name: str) -> str:
    """
    根据端点名称获取相应的速率限制
    """
    # 定义不同端点的速率限制策略
    rate_limits = {
        "login": "5 per minute",  # 登录接口限制较严格
        "register": "3 per minute",  # 注册接口限制较严格
        "forgot_password": "3 per minute",  # 忘记密码接口限制较严格
        "reset_password": "3 per minute",  # 重置密码接口限制较严格
        "contact": "10 per hour",  # 联系我们接口限制
        "comment": "10 per hour",  # 评论接口限制
        "article_create": "20 per hour",  # 文章创建接口限制
        "default": "100 per hour"  # 默认限制
    }
    
    return rate_limits.get(endpoint_name, rate_limits["default"])


# 预定义的速率限制装饰器
login_rate_limit = limiter.limit(get_rate_limit_for_endpoint("login"))
register_rate_limit = limiter.limit(get_rate_limit_for_endpoint("register"))
article_read_rate_limit = limiter.limit(get_rate_limit_for_endpoint("default"))
article_create_rate_limit = limiter.limit(get_rate_limit_for_endpoint("article_create"))
comment_rate_limit = limiter.limit(get_rate_limit_for_endpoint("comment"))

# 新增限流装饰器
forgot_password_rate_limit = limiter.limit(get_rate_limit_for_endpoint("forgot_password"))
reset_password_rate_limit = limiter.limit(get_rate_limit_for_endpoint("reset_password"))
contact_rate_limit = limiter.limit(get_rate_limit_for_endpoint("contact"))

# API 限流 - 更严格的限制
llm_chat_rate_limit = limiter.limit("20 per minute")  # LLM 聊天接口
conversation_create_rate_limit = limiter.limit("10 per minute")  # 创建对话
memory_create_rate_limit = limiter.limit("30 per minute")  # 创建记忆
image_upload_rate_limit = limiter.limit("10 per minute")  # 图片上传
oss_upload_rate_limit = limiter.limit("20 per minute")  # OSS 上传
image_gen_rate_limit = limiter.limit("6 per minute")  # 文生图（游客 IP 限流，成本较高）
message_create_rate_limit = limiter.limit("10 per minute")  # 留言创建接口（游客可发，防刷屏）

# 批量操作限流
batch_operation_rate_limit = limiter.limit("5 per minute")

# 导出所有限流装饰器
__all__ = [
    'limiter',
    'add_rate_limit_middleware',
    'get_rate_limit_for_endpoint',
    'login_rate_limit',
    'register_rate_limit',
    'article_read_rate_limit',
    'article_create_rate_limit',
    'comment_rate_limit',
    'forgot_password_rate_limit',
    'reset_password_rate_limit',
    'contact_rate_limit',
    'llm_chat_rate_limit',
    'conversation_create_rate_limit',
    'memory_create_rate_limit',
    'image_upload_rate_limit',
    'oss_upload_rate_limit',
    'image_gen_rate_limit',
    'message_create_rate_limit',
    'batch_operation_rate_limit',
]