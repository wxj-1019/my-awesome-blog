# My Awesome Blog - Project Context

> **权威规范（2026-07-20）**：编码与 Agent 规则以根目录 [`AGENTS.md`](./AGENTS.md) 与 [`docs/rules/`](./docs/rules/) 为准。  
> 历史修复见 [`docs/changelog-agents.md`](./docs/changelog-agents.md)。本文档为兼容性项目上下文，可能滞后。

## Overview

My Awesome Blog is a modern, enterprise-grade personal blog built with a monorepo architecture using Next.js (TypeScript) for the frontend and FastAPI (Python) for the backend. The project is designed with a microservices approach, featuring separate frontend and backend applications that communicate via RESTful APIs.

## Architecture

### Frontend (Next.js 16)
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Tailwind CSS Animate
- **UI Components**: Radix UI primitives, Lucide React icons
- **Testing**: Jest, React Testing Library
- **Code Quality**: ESLint, Prettier, Husky with lint-staged pre-commit hooks

### Backend (FastAPI)
- **Framework**: FastAPI with automatic OpenAPI documentation
- **Language**: Python 3.12+
- **Database**: PostgreSQL (production) with SQLAlchemy 2.0 ORM, SQLite for testing
- **Authentication**: JWT with OAuth2 password flow
- **Migrations**: Alembic for database schema management
- **Testing**: pytest with comprehensive test suite
- **Containerization**: Docker & Docker Compose

## Project Structure

```
├── frontend/              # Next.js frontend application
├── backend/               # FastAPI backend application
├── docs/                  # Documentation
├── .github/               # GitHub configuration
├── __tests__/             # Shared test utilities
├── docker-compose.yml     # Multi-service Docker orchestration
├── README.md              # Main project documentation
└── AGENTS.md              # AI agent guidelines and project rules
```

## Key Features

### Backend Features
- RESTful API for blog management
- User authentication and authorization
- Article CRUD operations with publishing workflow
- Comment system with threading and moderation
- Pagination, search, and filtering
- Automated API documentation (Swagger UI at `/docs`)
- Database migrations with Alembic

### Frontend Features
- Modern, responsive UI with Tailwind CSS
- SEO-optimized with Next.js
- Component-based architecture using Radix UI
- Comprehensive test coverage
- Pre-configured for deployment

## Development Setup

### Frontend Development
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)

### Backend Development
1. Navigate to the backend directory: `cd backend`
2. Create virtual environment: `python -m venv .venv`
3. Activate virtual environment:
   - Windows: `.venv\Scripts\activate`
   - Linux/Mac: `source .venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Set up environment: `cp .env.example .env` (then edit)
6. Run migrations: `alembic upgrade head`
7. Start server: `uvicorn app.main:app --reload --port 8989`
8. Access API at [http://localhost:8989](http://localhost:8989) with docs at [http://localhost:8989/docs](http://localhost:8989/docs)

### Docker Compose Setup (All-in-One)
1. From project root: `docker-compose up`
2. Starts PostgreSQL on port 5432 and FastAPI backend on port 8989

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login (OAuth2 form)
- `POST /api/v1/auth/login-json` - Login (JSON)

### Users
- `GET /api/v1/users/` - List users (admin only)
- `POST /api/v1/users/` - Create user (admin only)
- `GET /api/v1/users/{id}` - Get user by ID
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Articles
- `GET /api/v1/articles/` - List articles (filterable)
- `POST /api/v1/articles/` - Create article (authenticated)
- `GET /api/v1/articles/{id}` - Get article by ID
- `GET /api/v1/articles/slug/{slug}` - Get article by slug
- `PUT /api/v1/articles/{id}` - Update article (author or admin)
- `DELETE /api/v1/articles/{id}` - Delete article (author or admin)

### Comments
- `GET /api/v1/comments/` - List comments (filterable)
- `POST /api/v1/comments/` - Create comment (authenticated)
- `GET /api/v1/comments/{id}` - Get comment by ID
- `PUT /api/v1/comments/{id}` - Update comment (author or admin)
- `DELETE /api/v1/comments/{id}` - Delete comment (author, article author, or admin)
- `POST /api/v1/comments/{id}/approve` - Approve comment (article author or admin)

## Database Configuration

The backend uses PostgreSQL by default with these credentials (from docker-compose.yml):
- **Host**: localhost
- **Port**: 5432
- **Database**: my_awesome_blog
- **Username**: postgres
- **Password**: 123456

For development with SQLite, update `DATABASE_URL` in `.env` file.

## Testing

### Backend Tests
1. Navigate to backend: `cd backend`
2. Install test dependencies: `pip install -r requirements-test.txt`
3. Run tests: `pytest`

### Frontend Tests
1. Navigate to frontend: `cd frontend`
2. Run tests: `npm test`

## Deployment Considerations

### Backend
- Set `DEBUG=False` in production
- Use strong `SECRET_KEY`
- Configure proper CORS origins
- Use PostgreSQL in production (not SQLite)
- Set up database connection pooling
- Implement rate limiting
- Add monitoring and logging

### Frontend
- Build for production: `npm run build`
- Configure environment variables
- Set up CDN for static assets
- Implement proper error handling

## Development Conventions

### Frontend
- Component-based architecture using TypeScript
- Consistent styling with Tailwind CSS utility classes
- Proper separation of concerns in the App Router structure
- Testing with Jest and React Testing Library
- Code formatting enforced by Prettier and ESLint

### Backend
- Clean architecture with separation of concerns (models, schemas, CRUD operations, endpoints)
- Type safety with Pydantic models
- Proper error handling and validation
- Comprehensive test coverage with pytest
- Database migrations with Alembic

## Key Dependencies

### Frontend
- Next.js 16 with App Router
- React 18 with TypeScript
- Tailwind CSS for styling
- Radix UI for accessible components
- Lucide React for icons

### Backend
- FastAPI with automatic documentation
- SQLAlchemy 2.0 ORM
- Pydantic for data validation
- JWT for authentication
- Alembic for migrations
- PostgreSQL as primary database

## File Locations of Interest

- **Backend main app**: `backend/app/main.py`
- **Frontend main page**: `frontend/src/app/page.tsx`
- **API routes**: `backend/app/api/v1/endpoints/`
- **Database models**: `backend/app/models/`
- **Frontend components**: `frontend/src/components/`
- **Environment config**: `backend/.env.example`, `frontend/.env.example`
- **Docker configuration**: `docker-compose.yml`

## Common Commands

- **Start frontend**: `cd frontend && npm run dev`
- **Start backend**: `cd backend && uvicorn app.main:app --reload --port 8989`
- **Run all services**: `docker-compose up`
- **Run backend tests**: `cd backend && pytest`
- **Run frontend tests**: `cd frontend && npm test`
- **Format frontend code**: `cd frontend && npm run format`
- **Build frontend**: `cd frontend && npm run build`

## License

The project is dual-licensed - the main codebase appears to be under MIT license as mentioned in the READMEs, though there's an Apache 2.0 license file present as well.