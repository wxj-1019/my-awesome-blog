from typing import List, Optional
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
import secrets
import string
import re


BASE_DIR = Path(__file__).parent.parent.parent


def generate_secret_key(length: int = 64) -> str:
    """生成安全的随机密钥"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


# 常见的弱密码列表
WEAK_PASSWORDS = ['123456', 'password', '12345678', 'qwerty', '123456789', 'letmein', '1234567']


class Settings(BaseSettings):
    # Application
    DEBUG: bool = Field(default=True, description="调试模式")

    # Database
    DATABASE_URL: str = Field(..., description="数据库连接URL（必填）")
    DATABASE_POOL_SIZE: int = Field(default=20, description="数据库连接池大小")
    DATABASE_POOL_TIMEOUT: int = Field(default=30, description="数据库连接池超时时间（秒）")
    DATABASE_POOL_RECYCLE: int = Field(default=3600, description="数据库连接回收时间（秒）")
    DATABASE_MAX_OVERFLOW: int = Field(default=10, description="数据库连接池溢出大小（解决高并发阻塞问题）")

    # Application
    APP_NAME: str = Field(default="My Awesome Blog", description="应用名称")
    APP_VERSION: str = Field(default="1.0.0", description="应用版本")
    LOG_DIR: str = Field(default="logs", description="日志目录")
    STATIC_FILES_DIR: str = Field(default="static", description="静态文件目录")
    MAX_CONTENT_LENGTH: int = Field(default=10 * 1024 * 1024, description="最大上传文件大小（字节）")  # 10MB

    # Security
    SECRET_KEY: str = Field(default="", description="JWT密钥，生产环境中必须设置")
    ALGORITHM: str = Field(default="HS256", description="JWT算法")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="访问令牌过期时间（分钟）")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="刷新令牌过期时间（天）")
    PASSWORD_MIN_LENGTH: int = Field(default=8, description="密码最小长度")
    PASSWORD_REQUIRE_SPECIAL_CHARS: bool = Field(default=True, description="密码是否需要特殊字符")
    PASSWORD_REQUIRE_NUMBERS: bool = Field(default=True, description="密码是否需要数字")
    PASSWORD_REQUIRE_UPPERCASE: bool = Field(default=True, description="密码是否需要大写字母")
    PASSWORD_REQUIRE_LOWERCASE: bool = Field(default=True, description="密码是否需要小写字母")

    # Redis
    REDIS_HOST: str = Field(default="localhost", description="Redis主机地址")
    REDIS_PORT: int = Field(default=6379, description="Redis端口")
    REDIS_DB: int = Field(default=0, description="Redis数据库编号")
    REDIS_PASSWORD: Optional[str] = Field(default=None, description="Redis密码")
    REDIS_SSL: bool = Field(default=False, description="是否使用SSL连接Redis")
    REDIS_POOL_SIZE: int = Field(default=20, description="Redis连接池大小")

    # Aliyun OSS Configuration
    ALIBABA_CLOUD_ACCESS_KEY_ID: str = Field(default="", description="阿里云访问密钥ID")
    ALIBABA_CLOUD_ACCESS_KEY_SECRET: str = Field(default="", description="阿里云访问密钥")
    ALIBABA_CLOUD_OSS_ENDPOINT: str = Field(default="https://oss-cn-hangzhou.aliyuncs.com", description="OSS端点")
    ALIBABA_CLOUD_OSS_BUCKET_NAME: str = Field(default="my-awesome-blog", description="OSS桶名称")
    ALIBABA_CLOUD_OSS_REGION: str = Field(default="oss-cn-hangzhou", description="OSS区域")
    ALIBABA_CLOUD_OSS_CDN_DOMAIN: str = Field(default="", description="OSS CDN域名")

    # CORS - 生产环境应该限制更严格
    BACKEND_CORS_ORIGINS: List[str] = Field(default=["http://localhost:3000", "http://localhost:3001"], description="允许的CORS源")

    # Email configuration
    SMTP_HOST: Optional[str] = Field(default=None, description="SMTP服务器地址")
    SMTP_PORT: int = Field(default=587, description="SMTP端口")
    SMTP_USERNAME: Optional[str] = Field(default=None, description="SMTP用户名")
    SMTP_PASSWORD: Optional[str] = Field(default=None, description="SMTP密码")
    SMTP_FROM: Optional[str] = Field(default=None, description="发件人邮箱")
    EMAIL_ENABLED: bool = Field(default=False, description="是否启用邮件功能")
    FRONTEND_URL: str = Field(default="http://localhost:3000", description="前端URL")

    # Rate limiting
    RATE_LIMIT_DEFAULT: str = Field(default="1000/hour", description="默认速率限制")
    RATE_LIMIT_AUTHENTICATED: str = Field(default="2000/hour", description="认证用户速率限制")
    RATE_LIMIT_LOGIN: str = Field(default="5/minute", description="登录接口速率限制")
    RATE_LIMIT_REGISTER: str = Field(default="3/minute", description="注册接口速率限制")

    # Cache
    CACHE_DEFAULT_TTL: int = Field(default=3600, description="默认缓存TTL（秒）")
    CACHE_ARTICLES_TTL: int = Field(default=1800, description="文章缓存TTL（秒）")
    CACHE_USERS_TTL: int = Field(default=900, description="用户缓存TTL（秒）")

    # LLM Configuration
    LLM_DEFAULT_MODEL: str = Field(default="deepseek-chat", description="默认使用的LLM模型")
    LLM_TIMEOUT: int = Field(default=120, description="LLM API请求超时时间（秒）")
    LLM_MAX_RETRIES: int = Field(default=3, description="LLM API请求最大重试次数")
    LLM_STREAM_ENABLED: bool = Field(default=True, description="是否启用流式响应")

    # DeepSeek Configuration
    DEEPSEEK_API_KEY: str = Field(default="", description="DeepSeek API密钥")
    DEEPSEEK_BASE_URL: str = Field(default="https://api.deepseek.com/v1", description="DeepSeek API基础URL")
    DEEPSEEK_MODEL: str = Field(default="deepseek-chat", description="DeepSeek模型名称")

    # GLM (智谱) Configuration
    GLM_API_KEY: str = Field(default="", description="智谱AI API密钥")
    GLM_BASE_URL: str = Field(default="https://open.bigmodel.cn/api/paas/v4", description="智谱AI API基础URL")
    GLM_MODEL: str = Field(default="glm-4-plus", description="智谱AI模型名称")

    # Qwen (通义千问) Configuration
    QWEN_API_KEY: str = Field(default="", description="通义千问API密钥")
    QWEN_BASE_URL: str = Field(default="https://dashscope.aliyuncs.com/compatible-mode/v1", description="通义千问API基础URL")
    QWEN_MODEL: str = Field(default="qwen-plus", description="通义千问模型名称")

    # LangChain Configuration
    LANGCHAIN_ENABLED: bool = Field(default=True, description="是否启用LangChain集成")
    LANGCHAIN_VERBOSE: bool = Field(default=False, description="是否启用LangChain详细日志")
    LANGCHAIN_TRACING_V2: bool = Field(default=False, description="是否启用LangChain Tracing v2")
    LANGCHAIN_API_KEY: str = Field(default="", description="LangSmith API密钥（用于追踪和调试）")
    LANGCHAIN_PROJECT: str = Field(default="my-awesome-blog", description="LangSmith项目名称")

    # Prompt Management
    PROMPT_DEFAULT_VERSION: str = Field(default="v1", description="默认提示词版本")
    PROMPT_MAX_VERSIONS: int = Field(default=10, description="每个提示词最多保留的版本数")
    PROMPT_AB_TEST_ENABLED: bool = Field(default=True, description="是否启用A/B测试")
    PROMPT_AB_TEST_TRAFFIC_SPLIT: float = Field(default=0.5, description="A/B测试流量分配比例（0-1）")

    # Context Management
    CONTEXT_DEFAULT_WINDOW_SIZE: int = Field(default=10, description="默认上下文窗口大小（消息数）")
    CONTEXT_MAX_WINDOW_SIZE: int = Field(default=50, description="最大上下文窗口大小")
    CONTEXT_SUMMARIZATION_ENABLED: bool = Field(default=True, description="是否启用上下文摘要")
    CONTEXT_SUMMARIZATION_THRESHOLD: int = Field(default=20, description="触发摘要的消息数阈值")
    CONTEXT_SUMMARIZATION_MODEL: str = Field(default="deepseek-chat", description="上下文摘要使用的模型")

    # Memory Management
    MEMORY_SHORT_TERM_ENABLED: bool = Field(default=True, description="是否启用短期记忆（Redis）")
    MEMORY_SHORT_TERM_TTL: int = Field(default=3600, description="短期记忆过期时间（秒）")
    MEMORY_LONG_TERM_ENABLED: bool = Field(default=True, description="是否启用长期记忆（PGVector）")
    MEMORY_LONG_TERM_MAX_RESULTS: int = Field(default=5, description="长期记忆检索最大结果数")
    MEMORY_LONG_TERM_THRESHOLD: float = Field(default=0.7, description="长期记忆相似度阈值（0-1）")
    MEMORY_VECTOR_DIMENSION: int = Field(default=1536, description="向量维度")

    # Conversation Management
    CONVERSATION_MAX_MESSAGES: int = Field(default=1000, description="单个会话最大消息数")
    CONVERSATION_AUTO_TITLE_ENABLED: bool = Field(default=True, description="是否自动生成会话标题")
    CONVERSATION_TITLE_MODEL: str = Field(default="deepseek-chat", description="生成会话标题使用的模型")

    # Tenant Management
    TENANT_ENABLED: bool = Field(default=True, description="是否启用多租户功能")
    TENANT_DEFAULT_MAX_STORAGE_MB: int = Field(default=1024, description="默认租户最大存储空间（MB）")
    TENANT_DEFAULT_CONTEXT_WINDOW_SIZE: int = Field(default=10, description="默认租户上下文窗口大小")

    # Weather API (ALAPI)
    ALAPI_TOKEN: str = Field(default="", description="ALAPI 天气服务密钥")

    # Pagination
    DEFAULT_PAGE_SIZE: int = Field(default=20, description="默认页面大小")
    MAX_PAGE_SIZE: int = Field(default=100, description="最大页面大小")
    MIN_PAGE_SIZE: int = Field(default=1, description="最小页面大小")

    # Upload Security
    UPLOAD_ALLOWED_EXTENSIONS: List[str] = Field(default=[".jpg", ".jpeg", ".png", ".gif", ".webp"], description="允许的上传文件扩展名")
    UPLOAD_MAX_FILE_SIZE: int = Field(default=10 * 1024 * 1024, description="单个文件最大大小（字节）")
    UPLOAD_MAX_BATCH_SIZE: int = Field(default=50 * 1024 * 1024, description="批量上传总大小限制（字节）")
    UPLOAD_MAX_FILES_PER_BATCH: int = Field(default=10, description="批量上传最大文件数")

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @field_validator('DATABASE_URL')
    @classmethod
    def validate_database_url(cls, v: str, info) -> str:
        """验证数据库URL不使用弱密码"""
        if not v:
            raise ValueError("DATABASE_URL 不能为空")

        # 获取 DEBUG 模式 - 需要处理字符串和布尔值
        data = info.data
        debug_raw = data.get('DEBUG', True)
        debug = debug_raw if isinstance(debug_raw, bool) else str(debug_raw).lower() in ('true', '1', 'yes')

        # 检查弱密码（仅在非调试模式下强制检查）
        for weak_pwd in WEAK_PASSWORDS:
            if weak_pwd in v:
                if not debug:
                    raise ValueError(f"数据库密码过于简单，不能使用常见弱密码: {weak_pwd}")
                else:
                    print(f"WARNING: 数据库密码包含弱密码模式: {weak_pwd}")
        return v

    @field_validator('SECRET_KEY')
    @classmethod
    def validate_secret_key(cls, v: str, info) -> str:
        """验证SECRET_KEY强度"""
        # 获取 DEBUG 模式 - 需要处理字符串和布尔值
        data = info.data
        debug_raw = data.get('DEBUG', True)
        debug = debug_raw if isinstance(debug_raw, bool) else str(debug_raw).lower() in ('true', '1', 'yes')

        # 如果未设置，生产环境必须显式设置，调试环境自动生成
        if not v:
            if not debug:
                raise ValueError("SECRET_KEY 必须显式设置在环境变量中，生产环境不允许自动生成")
            v = generate_secret_key()
            print(f"WARNING: SECRET_KEY 未设置，已自动生成用于调试")

        weak_keys = [
            'your-super-secret-key',
            'change-this',
            'your-secret-key-here',
            '00000000000000000000000000000000',
            '11111111111111111111111111111111'
        ]

        # 检查是否使用了弱密钥
        for weak in weak_keys:
            if weak in v.lower():
                if not debug:
                    raise ValueError(f"SECRET_KEY 必须使用强密钥，当前包含弱密钥模式: {weak}")
                else:
                    print(f"WARNING: SECRET_KEY 包含弱密钥模式: {weak}")

        # 检查密钥长度
        if len(v) < 32:
            if not debug:
                raise ValueError(f"SECRET_KEY 长度必须至少32字节，当前: {len(v)}")
            else:
                print(f"WARNING: SECRET_KEY 长度不足32字节，当前: {len(v)}")

        return v

    @field_validator('BACKEND_CORS_ORIGINS')
    @classmethod
    def validate_cors_origins(cls, v: List[str], info) -> List[str]:
        """验证CORS配置安全性"""
        data = info.data
        debug_raw = data.get('DEBUG', True)
        debug = debug_raw if isinstance(debug_raw, bool) else str(debug_raw).lower() in ('true', '1', 'yes')

        if not debug:
            # 生产环境不应该允许 localhost
            for origin in v:
                if 'localhost' in origin.lower() or '127.0.0.1' in origin:
                    raise ValueError(f"生产环境 CORS 不应该包含本地地址: {origin}")

        return v

    def validate_required_fields(self) -> None:
        """Validate that required fields are properly set."""
        # SECRET_KEY 已在 field_validator 中验证
        
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL 必须设置在环境变量中")

        if not self.REDIS_HOST:
            raise ValueError("REDIS_HOST 必须设置在环境变量中")

        if not self.SMTP_HOST and self.EMAIL_ENABLED:
            print("WARNING: SMTP_HOST is not set but EMAIL_ENABLED is True. Email functionality will be disabled.")

        if not self.SMTP_USERNAME or not self.SMTP_PASSWORD:
            if self.EMAIL_ENABLED:
                print("WARNING: SMTP credentials are not set. Email functionality will be disabled.")

        if not self.ALIBABA_CLOUD_ACCESS_KEY_ID or not self.ALIBABA_CLOUD_ACCESS_KEY_SECRET:
            if self.DEBUG:
                print("WARNING: Alibaba Cloud credentials are not set. OSS functionality will be disabled.")


settings = Settings()
settings.validate_required_fields()
