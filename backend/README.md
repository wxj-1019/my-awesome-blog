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
├── alembic/                    # 数据库迁移文件
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       ├── 001_add_new_tables.py
│       ├── 002_add_typewriter_contents_table.py
│       └── 003_migrate_to_uuid.py
├── app/                        # 主应用代码
│   ├── __init__.py
│   ├── main.py                # FastAPI应用入口
│   ├── api/                   # API路由
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py
│   │       └── endpoints/     # API端点
│   │           ├── __init__.py
│   │           ├── auth.py
│   │           ├── users.py
│   │           ├── articles.py
│   │           ├── comments.py
│   │           ├── categories.py
│   │           ├── tags.py
│   │           ├── friend_links.py
│   │           ├── portfolio.py
│   │           ├── timeline_events.py
│   │           ├── statistics.py
│   │           ├── subscriptions.py
│   │           ├── images.py
│   │           └── typewriter_contents.py
│   ├── core/                  # 核心配置和工具
│   │   ├── __init__.py
│   │   ├── config.py          # 应用配置
│   │   ├── database.py        # 数据库配置
│   │   ├── security.py        # 安全相关
│   │   └── dependencies.py    # 依赖注入
│   ├── models/                # SQLAlchemy模型
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── article.py
│   │   ├── comment.py
│   │   ├── category.py
│   │   ├── tag.py
│   │   ├── friend_link.py
│   │   ├── portfolio.py
│   │   ├── timeline_event.py
│   │   ├── subscription.py
│   │   ├── image.py
│   │   ├── typewriter_content.py
│   │   ├── article_category.py
│   │   └── article_tag.py
│   ├── schemas/               # Pydantic模型（数据验证）
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── article.py
│   │   ├── comment.py
│   │   ├── category.py
│   │   ├── tag.py
│   │   ├── friend_link.py
│   │   ├── portfolio.py
│   │   ├── timeline_event.py
│   │   ├── subscription.py
│   │   ├── image.py
│   │   ├── typewriter_content.py
│   │   ├── token.py
│   │   └── statistics.py
│   ├── crud/                  # 数据库CRUD操作
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── article.py
│   │   ├── comment.py
│   │   ├── category.py
│   │   ├── tag.py
│   │   ├── friend_link.py
│   │   ├── portfolio.py
│   │   ├── timeline_event.py
│   │   ├── subscription.py
│   │   ├── image.py
│   │   └── typewriter_content.py
│   ├── services/              # 业务逻辑服务
│   │   ├── __init__.py
│   │   ├── cache_service.py
│   │   ├── email_service.py
│   │   ├── image_service.py
│   │   └── statistics_service.py
│   ├── utils/                 # 工具函数
│   │   ├── __init__.py
│   │   ├── logger.py
│   │   └── middleware.py
│   ├── logs/                  # 日志文件
│   └── tests/                 # 测试文件
│       └── [测试文件]
├── scripts/                   # 脚本文件
│   ├── __init__.py
│   ├── create_admin_user.py
│   ├── run_server.py
│   ├── simple_server.py
│   ├── run_migration.py
│   ├── db_setup.py
│   ├── diagnose_db.py
│   ├── fix_db_connection.py
│   ├── run_migrations.py
│   └── update_db_config.py
├── docs/                      # 文档
│   ├── API_DOCUMENTATION.md
│   └── PROJECT_STRUCTURE.md
├── migration_scripts/         # 临时迁移脚本
│   ├── migrate_to_uuid.py
│   ├── migrate_to_uuid_complete.py
│   ├── migrate_to_uuid_final.py
│   ├── migrate_to_uuid_precise.py
│   ├── migrate_to_uuid_safe_method.py
│   └── migrate_to_uuid_safe.py
├── logs/                      # 日志输出目录
├── .env.example              # 环境变量示例
├── .gitignore
├── alembic.ini               # Alembic配置
├── requirements.txt          # 生产依赖
├── requirements-test.txt     # 测试依赖
├── Dockerfile
├── docker-compose.yml        # 如果存在
├── pytest.ini                # Pytest配置
├── PROJECT_STRUCTURE.md      # 项目结构文档
├── README.md
└── init_db.bat              # 初始化数据库脚本（Windows）
```

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

Use the provided database initialization script:

```bash
# Windows
python scripts/init_db_simple.py

# Or use the batch script
init_db.bat
```

**Option B: Using Diagnostic Tools (Windows-specific)**

Use the provided diagnostic and repair tools:

```bash
# Step 1: Diagnose database connection
python scripts/diagnose_db.py

# Step 2: Fix any issues found (creates database if missing)
python scripts/fix_db_connection.py

# Step 3: Update database configuration if needed
python scripts/update_db_config.py
```

**Option C: Manual Setup**

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

## Database Setup Tools (Windows-Specific)

We provide automated tools to help set up and troubleshoot your PostgreSQL database on Windows.

### Available Scripts

#### 1. Database Diagnostic Tool (`scripts/diagnose_db.py`)

Diagnoses PostgreSQL connection issues:

```bash
python scripts/diagnose_db.py
```

Checks:
- PostgreSQL service status
- Port availability (5432)
- Server connectivity
- Database existence
- User credentials

#### 2. Database Repair Tool (`scripts/fix_db_connection.py`)

Automatically creates missing databases and initializes table structure:

```bash
python scripts/fix_db_connection.py
```

This script will:
- Create the database if it doesn't exist
- Create all required tables
- Create the default admin user (username: `admin`, password: `admin123`)

#### 3. Configuration Update Tool (`scripts/update_db_config.py`)

Update database connection parameters interactively:

```bash
python scripts/update_db_config.py
```

Allows you to update:
- Host address
- Port number
- Database name
- Username
- Password

### Troubleshooting Common Issues

#### Database Doesn't Exist
```bash
# Run diagnostics first
python scripts/diagnose_db.py

# Then run the fix script
python scripts/fix_db_connection.py
```

#### Authentication Errors
```bash
# Update your credentials
python scripts/update_db_config.py
```

#### Service Not Running
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

This will:
- Start PostgreSQL container on port 5432
- Create database `my_awesome_blog`
- Set user `postgres` with password `123456`

## License

MIT