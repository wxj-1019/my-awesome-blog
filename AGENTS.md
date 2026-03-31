# AGENTS.md - My Awesome Blog

> This file contains essential information for AI coding agents working on this project.
> Last updated: 2026-03-22

## Project Overview

My Awesome Blog is a modern, enterprise-grade personal blog platform built with a full-stack architecture:

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python 3.12+) + PostgreSQL + Redis
- **AI Features**: Multi-LLM support (DeepSeek, GLM, Qwen) with memory and conversation management
- **Deployment**: Docker Compose with Nginx reverse proxy

### Project Structure

```
my-awesome-blog/
├── frontend/              # Next.js frontend application
├── backend/               # FastAPI backend application
├── docs/                  # Documentation
├── nginx/                 # Nginx configuration
├── .github/workflows/     # CI/CD pipelines
├── docker-compose.yml     # Development environment
├── docker-compose.prod.yml # Production environment
└── deploy.ps1            # Deployment script
```

## Technology Stack

### Frontend

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js | ^16.1.6 |
| Language | TypeScript | ^5.0.0 |
| Styling | Tailwind CSS | ^3.3.0 |
| UI Components | Radix UI | Latest |
| Animation | Framer Motion, GSAP | ^12.34.0, ^3.14.2 |
| State Management | React Context | Built-in |
| Authentication | next-auth | ^4.24.13 |
| Testing | Jest + Testing Library | ^29.7.0 |

### Backend

| Category | Technology | Version |
|----------|------------|---------|
| Framework | FastAPI | 0.115.6 |
| Server | Uvicorn | 0.36.0 |
| Database | PostgreSQL + SQLAlchemy 2.0 | 15-alpine |
| Migrations | Alembic | 1.13.1 |
| Validation | Pydantic v2 | 2.12.5 |
| Auth | python-jose + passlib | 3.3.0 |
| Cache | Redis | 7-alpine |
| Storage | Alibaba Cloud OSS | Optional |
| LLM | DeepSeek, GLM, Qwen | Multi-provider |

## Build and Development Commands

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Format code
npm run format

# Run tests
npm test
npm run test:watch
```

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8989

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "Description"

# Run tests
pytest
pytest --cov=app --cov-report=html
```

### Docker Compose (All-in-one)

```bash
# Development
docker-compose up

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## Code Style Guidelines

### TypeScript/JavaScript (Frontend)

- **Linter**: ESLint with Next.js recommended rules
- **Formatter**: Prettier (2-space tabs, single quotes, trailing commas)
- **Key Rules**:
  - `no-console`: warn
  - `no-debugger`: error
  - `prefer-const`: error
  - `no-var`: error
  - `eqeqeq`: error (strict equality)
  - `camelcase`: error

### Python (Backend)

- Follow PEP 8 style guidelines
- Use type hints throughout
- Maximum line length: 100 characters
- Use `async/await` for async operations

### Git Workflow

- **Pre-commit hooks**: Husky + lint-staged
- **Commit convention**: Conventional commits
- **CI triggers**: Push/PR to `main` branch

## Testing Instructions

### Frontend Testing

```bash
cd frontend
npm test
```

- **Framework**: Jest with jsdom environment
- **Coverage threshold**: 50% (branches, functions, lines, statements)
- **Test files**: `**/__tests__/**/*.{ts,tsx}`, `**/?(*.)+(spec|test).{ts,tsx}`

### Backend Testing

```bash
cd backend
pytest
```

- **Configuration**: `pytest.ini`
- **Test location**: `app/tests/`
- **Coverage**: Use `--cov=app` flag
- **Database**: Tests use PostgreSQL service in CI

## API Architecture

### Base URL

- Development: `http://localhost:8989/api/v1`
- Production: `http://49.234.190.85/api/v1`

### Main Endpoints

| Resource | Endpoints |
|----------|-----------|
| Auth | `/auth/register`, `/auth/login`, `/auth/login-json` |
| Users | `/users/`, `/users/{id}` |
| Articles | `/articles/`, `/articles/{id}`, `/articles/slug/{slug}` |
| Comments | `/comments/`, `/comments/{id}/approve` |
| Categories | `/categories/`, `/categories/{id}` |
| Tags | `/tags/`, `/tags/{id}` |
| AI/LLM | `/llm/chat`, `/conversations/`, `/memories/` |
| Monitoring | `/monitoring/`, `/statistics/` |

### API Documentation

- Swagger UI: `/docs`
- ReDoc: `/redoc`
- OpenAPI JSON: `/api/v1/openapi.json`

## Database Architecture

### Models (SQLAlchemy)

- **User**: Authentication, roles (admin/user)
- **Article**: Blog posts with slug, status (draft/published)
- **Comment**: Threaded comments with moderation
- **Category**: Article categorization
- **Tag**: Article tagging
- **Conversation**: AI chat sessions
- **Memory**: Long-term AI memory storage
- **Portfolio**: Project showcases
- **TimelineEvent**: Life events tracking

### Migration Workflow

```bash
# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Environment Configuration

### Required Environment Variables

#### Backend (.env)

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/my_awesome_blog

# Security (REQUIRED)
SECRET_KEY=your-super-secret-key-min-32-bytes

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# LLM Providers (Optional)
DEEPSEEK_API_KEY=your_key
GLM_API_KEY=your_key
QWEN_API_KEY=your_key

# Aliyun OSS (Optional)
ALIBABA_CLOUD_ACCESS_KEY_ID=your_key
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_secret
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8989/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Port Configuration

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | Next.js dev server |
| Backend | 8989 | FastAPI (project standard) |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |
| Nginx | 80/443 | Production proxy |

## Security Considerations

### Authentication

- JWT tokens with configurable expiration
- OAuth2 password flow
- Role-based access control (RBAC)

### Security Features

- **Rate Limiting**: Configurable per endpoint (slowapi)
- **CORS**: Restricted origins in production
- **Password Policy**: Minimum 8 chars, requires numbers, uppercase, lowercase
- **Request Size Limit**: 10MB default
- **Password Validation**: Rejects weak passwords (123456, password, etc.)

### Production Checklist

- [ ] Set `DEBUG=false`
- [ ] Use strong `SECRET_KEY` (32+ bytes)
- [ ] Configure proper `BACKEND_CORS_ORIGINS`
- [ ] Use PostgreSQL (not SQLite)
- [ ] Enable Redis for caching
- [ ] Set up SSL/TLS certificates
- [ ] Configure rate limiting
- [ ] Remove localhost from CORS

## Deployment Process

### Production Deployment (PowerShell)

```powershell
# Run deployment script
./deploy.ps1
```

This script will:
1. Check local environment
2. Validate `.env.production`
3. Test SSH connection
4. Sync files to server (49.234.190.85)
5. Build and start Docker containers
6. Run database migrations

### Manual Deployment Steps

```bash
# 1. Copy .env.production
cp .env.production.example .env.production
# Edit with production values

# 2. Deploy via Docker Compose
ssh root@49.234.190.85
cd /opt/my-awesome-blog
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD Pipelines

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `frontend-ci.yml` | Push to `frontend/**` | Lint, test, build frontend |
| `backend-ci.yml` | Push to `backend/**` | Test backend with PostgreSQL |
| `deploy.yml` | Push to `main` | Deploy to production |

## AI/LLM Integration

### Supported Providers

1. **DeepSeek** (default): `deepseek-chat`
2. **GLM (智谱)**: `glm-4-plus`
3. **Qwen (通义千问)**: `qwen-plus`

### Features

- **Streaming responses**: Real-time chat
- **Context management**: Sliding window with summarization
- **Memory system**: Short-term (Redis) + Long-term (PGVector)
- **Prompt management**: Version control and A/B testing
- **Multi-tenancy**: Isolated contexts per tenant

### Configuration

```env
LLM_DEFAULT_MODEL=deepseek-chat
LLM_TIMEOUT=120
LLM_MAX_RETRIES=3
LLM_STREAM_ENABLED=true
```

## Troubleshooting

### Database Issues (Windows)

```bash
cd backend

# Diagnose connection
python scripts/diagnose_db.py

# Fix issues automatically
python scripts/fix_db_connection.py
```

### Common Errors

| Error | Solution |
|-------|----------|
| `DATABASE_URL` not set | Copy `.env.example` to `.env` |
| Weak password error | Use stronger password or set `DEBUG=true` |
| CORS error | Check `BACKEND_CORS_ORIGINS` includes frontend URL |
| Port 8989 in use | Kill process or change port |
| Migration failed | Run `alembic upgrade head` |

## File Structure Conventions

### Frontend

```
frontend/src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── admin/       # Admin panel components
│   ├── ui/          # Reusable UI components
│   └── [feature]/   # Feature-specific components
├── lib/             # Utility functions, API clients
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
├── styles/          # Global styles, Tailwind extensions
└── services/        # Business logic services
```

### Backend

```
backend/app/
├── api/v1/endpoints/  # API route handlers
├── core/              # Config, database, security
├── models/            # SQLAlchemy ORM models
├── schemas/           # Pydantic validation models
├── crud/              # Database CRUD operations
├── services/          # Business logic
├── utils/             # Utility functions
└── tests/             # Test suite
```

## Important Notes for Agents

1. **Always check `.env` files exist** before running servers
2. **Database migrations** must be run after model changes
3. **Port 8989** is the standard backend port (not 8000)
4. **Use async/await** for all database operations in backend
5. **TypeScript strict mode** is enabled - ensure type safety
6. **Test on both Node 18 and 20** (CI requirement)
7. **Python 3.12+** is required for backend
8. **Chinese comments** are common in this codebase - maintain consistency

## License

MIT License - See LICENSE file for details
