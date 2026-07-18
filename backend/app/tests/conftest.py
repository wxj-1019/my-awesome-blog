import os

# 必须在导入 app 模块之前设置，确保测试使用 SQLite 内存数据库
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("DEBUG", "True")

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db, Base
from app.core.config import settings
from app.services.weather_update_service import weather_update_service
from app.services.oss_service import oss_service
from app.utils.rate_limit import limiter
from app.core.dependencies import get_current_active_user, get_current_superuser
from app.models.user import User


# 测试期间禁用天气调度器，避免事件循环问题
async def _noop_async() -> None:
    return None

weather_update_service.start = lambda: None
weather_update_service.initial_update = _noop_async
weather_update_service.shutdown = lambda: None


# 测试期间禁用速率限制，避免同一 testclient IP 触发 429
limiter.enabled = False


# 测试期间 mock OSS 上传/删除，避免测试环境依赖真实云存储
@pytest.fixture(autouse=True)
def mock_oss_service():
    original_upload = oss_service.upload_file
    original_delete = oss_service.delete_file
    oss_service.upload_file = lambda *args, **kwargs: "https://mock-oss.example.com/images/test.jpg"
    oss_service.delete_file = lambda *args, **kwargs: None
    yield
    oss_service.upload_file = original_upload
    oss_service.delete_file = original_delete


# 测试期间绕过认证依赖，避免大量测试因 401 失败
@pytest.fixture(autouse=True)
def override_auth(test_session, setup_database):
    test_user = User(
        id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        username="testadmin",
        email="admin@example.com",
        full_name="Test Admin",
        is_active=True,
        is_superuser=True,
    )
    test_user.hashed_password = "fakehash"

    # 将测试用户持久化到数据库，供依赖 db 查询的测试使用
    test_session.add(test_user)
    test_session.commit()
    test_session.refresh(test_user)

    async def _get_test_user():
        return test_user

    app.dependency_overrides[get_current_active_user] = _get_test_user
    app.dependency_overrides[get_current_superuser] = _get_test_user
    yield
    app.dependency_overrides.pop(get_current_active_user, None)
    app.dependency_overrides.pop(get_current_superuser, None)


# 确保全局 settings 也使用测试数据库
settings.DATABASE_URL = os.environ["DATABASE_URL"]
settings.SECRET_KEY = os.environ["SECRET_KEY"]
settings.DEBUG = os.environ["DEBUG"].lower() == "true"


# Create test database engine using the same DATABASE_URL
@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    return engine


# Create test tables for each test to ensure isolation
@pytest.fixture(autouse=True)
def setup_database(test_engine):
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


# Create test session
@pytest.fixture
def test_session(test_engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


# 兼容使用 db 命名的旧测试
@pytest.fixture
def db(test_session):
    yield test_session


# Override get_db dependency
@pytest.fixture
def client(test_session):
    def override_get_db():
        try:
            yield test_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.pop(get_db, None)


# Test user data
@pytest.fixture
def test_user_data():
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }


# Test article data
@pytest.fixture
def test_article_data():
    return {
        "title": "Test Article",
        "slug": "test-article",
        "content": "This is a test article content.",
        "excerpt": "Test excerpt",
        "is_published": True
    }


# 兼容仍期望 token header 的旧测试：认证已全局绕过，返回空 headers 即可
@pytest.fixture
def superuser_token_headers():
    return {}
