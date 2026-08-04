# My Awesome Blog - Backend

FastAPI backend for the My Awesome Blog application.

## Features

- **FastAPI**: High-performance Python web framework with automatic OpenAPI documentation
- **PostgreSQL**: Production-ready database with SQLAlchemy ORM
- **JWT Authentication**: Secure token-based authentication with OAuth2
- **RESTful API**: Complete CRUD operations for articles, comments, and users
- **Database Migrations**: Alembic for schema management
- **Type Safety**: Full type hints with Pydantic validation
- **Testing**: Comprehensive test suite with pytest
- **Docker Support**: Containerized development and deployment

## Project Structure

```
backend/
├── alembic/                    # 数据库迁移
│   ├── env.py · script.py.mako
│   └── versions/               # 000~014，含全文检索/审计日志/LLM/天气/软删除/pgvector
├── app/                        # 主应用代码
│   ├── main.py                 # FastAPI 入口（lifespan / 中间件 / 路由注册）
│   ├── api/v1/
│   │   ├── router.py           # 路由注册权威清单
│   │   └── endpoints/          # 26 个端点：articles/comments/auth/users/categories/tags
│   │                           #   + friend_links/portfolio/timeline_events/subscriptions
│   │                           #   + messages/albums/typewriter_contents/images/oss_upload
│   │                           #   + statistics/analytics/monitoring/audit_logs/weather
│   │                           #   + AI 域：llm/agent/conversations/memories/prompts
│   │                           #   + 租户：tenants
│   ├── agent/                  # AI Agent 循环 + 工具注册（tools/builtin.py）
│   ├── llm/                    # 多 LLM 提供商（deepseek/glm/qwen + provider_factory）
│   ├── conversation/ · memory/ · context/ · prompts/   # AI 记忆/对话/上下文/提示词
│   ├── core/                   # config · database(_async) · security · dependencies
│   │                           #   + soft_delete · types · vector_db · exception_handlers
│   ├── models/                 # SQLAlchemy 模型（含 models/logs/ 审计与请求日志）
│   ├── schemas/                # Pydantic v2 入参/出参
│   ├── crud/                   # 数据库 CRUD 操作（按域拆分）
│   ├── services/               # 业务逻辑：cache/email/image/oss/statistics/tenant
│   │                           #   + AI：agent/llm/conversation/memory/prompt/context
│   │                           #   + weather(_update)
│   ├── utils/                  # logger/middleware/rate_limit/perf_monitor/pagination
│   │                           #   + cache/oss/file_validation/security/permission 等
│   ├── exceptions/             # 自定义异常
│   ├── middleware/             # 中间件（请求大小限制等）
│   ├── tests/                  # pytest 用例（conftest + 21 个测试模块）
│   └── logs/                   # 运行日志
├── scripts/                    # 运维/数据脚本
│   ├── init_db.py · init_pgvector.py · seed_ai_articles.py
│   ├── make_superuser.py · reset_admin_password.py · verify_images.py
│   ├── check_*.py · migration_*.py · run_migration(.bat/.ps1)   # 迁移与检查工具
│   ├── init/ · seed/           # 初始化与种子数据子目录
│   └── （历史 test_*.py / migrate_*.py 归档于此）
├── alembic.ini                 # Alembic 配置
├── pyproject.toml · pytest.ini # 工程与测试配置
├── requirements.txt · requirements-test.txt
├── Dockerfile · .dockerignore
├── .env.example                # 环境变量模板（真实 .env 不入库）
└── README.md                   # 本文件
```

> 路由前缀均为 `/api/v1/*`，完整清单见 `app/api/v1/router.py`，运行时见 `/docs`。

## Quick Start

### Prerequisites

- Python 3.12+
- PostgreSQL 15+ (or SQLite for development)
- Git

### Installation

1. Clone the repository and navigate to backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Copy environment variables template:
```bash
cp .env.example .env
```

5. Edit `.env` file with your database configuration:
```env
DATABASE_URL=postgresql://postgres:123456@localhost:5432/my_awesome_blog
SECRET_KEY=your-super-secret-key-change-this-in-production
```

6. Initialize database and run migrations:

**Option A: Automatic Setup (Recommended)**

Use the provided database initialization script (creates tables + seed data):

```bash
python scripts/init_db.py
```

To create or promote an admin user afterward:

```bash
python scripts/make_superuser.py
```

**Option B: Manual Setup**

```bash
# Run migrations
alembic upgrade head
```

7. Start the development server:
```bash
uvicorn app.main:app --reload --port 8989
```

8. Open API documentation: http://localhost:8989/docs

### Using Docker Compose

From the project root directory:

```bash
docker-compose up
```

This will start:
- PostgreSQL on port 5432
- FastAPI backend on port 8989

## API Documentation

Once the server is running, you can access:

- **Swagger UI**: http://localhost:8989/docs
- **ReDoc**: http://localhost:8989/redoc
- **OpenAPI JSON**: http://localhost:8989/api/v1/openapi.json

## Database Migrations

When you modify the SQLAlchemy models, create a new migration:

```bash
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

To rollback a migration:
```bash
alembic downgrade -1
```

## Testing

1. Install test dependencies:
```bash
pip install -r requirements-test.txt
```

2. Run tests:
```bash
pytest
```

3. Run tests with coverage:
```bash
pytest --cov=app --cov-report=html
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection URL | `postgresql://postgres:123456@localhost:5432/my_awesome_blog` |
| `SECRET_KEY` | JWT secret key | `your-super-secret-key-change-this-in-production` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time | `30` |
| `DEBUG` | Debug mode | `True` |
| `BACKEND_CORS_ORIGINS` | Allowed CORS origins | `["http://localhost:3000", "http://localhost:8989"]` |

## Deployment

### Docker Deployment

1. Build the Docker image:
```bash
docker build -t my-awesome-blog-backend .
```

2. Run the container:
```bash
docker run -p 8989:8989 --env-file .env my-awesome-blog-backend
```

### Production Considerations

1. Set `DEBUG=False` in production
2. Use a strong, randomly generated `SECRET_KEY`
3. Configure proper CORS origins for your frontend domain
4. Use PostgreSQL with connection pooling in production
5. Implement rate limiting
6. Set up monitoring and logging
7. Use HTTPS with SSL/TLS certificates
8. Implement proper backup strategy for database

## Development

### Code Style

This project uses:
- **Black** for code formatting
- **isort** for import sorting
- **mypy** for type checking (optional)

### Pre-commit Hooks

To set up pre-commit hooks:

1. Install pre-commit:
```bash
pip install pre-commit
```

2. Install hooks:
```bash
pre-commit install
```

## Database Setup Tools

### Available Scripts

#### 1. Database Initialization (`scripts/init_db.py`)

Creates all tables and seed data:

```bash
python scripts/init_db.py
```

#### 2. pgvector Extension (`scripts/init_pgvector.py`)

Enables the PostgreSQL vector extension (required by AI memory / semantic search):

```bash
python scripts/init_pgvector.py
```

#### 3. Admin User Management

```bash
python scripts/make_superuser.py        # 提升已有用户为超级管理员
python scripts/reset_admin_password.py  # 重置管理员密码
```

#### 4. Migration Helpers

```bash
# 一键检查连接 + 迁移 + 验证（Windows）
scripts\run_migration.bat
# 或 PowerShell
scripts\run_migration.ps1

# 仅查看迁移状态
python scripts/migration_status.py
```

### Troubleshooting Common Issues

#### Service Not Running (Windows)
```cmd
# Check service status
sc query postgresql-x64-17

# Start PostgreSQL service (run as Administrator)
net start postgresql-x64-17
```

### Using Docker Compose

Alternatively, use Docker Compose for easy PostgreSQL setup:

```bash
docker-compose up -d postgres
```

## License

MIT