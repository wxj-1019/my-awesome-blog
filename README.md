# My Awesome Blog

A modern, enterprise-grade personal blog built with Next.js, TypeScript, Tailwind CSS, and FastAPI.

## Project Structure

This project follows a monorepo structure:

```
├── frontend/              # Next.js frontend application
├── backend/               # FastAPI backend application (new!)
├── docs/                  # Documentation
├── .github/               # GitHub configuration
└── __tests__/             # Shared test utilities
```

## Frontend Application

The frontend is located in the `frontend/` directory and includes:

- Next.js 16 application with App Router
- TypeScript
- Tailwind CSS
- ESLint and Prettier
- Jest for testing
- GitHub Actions for CI/CD

## Backend Application

The backend is located in the `backend/` directory and includes:

- **FastAPI** - High-performance web framework
- **PostgreSQL** - Production database (SQLite for testing)
- **SQLAlchemy 2.0** - ORM with async support
- **Alembic** - Database migrations
- **Pydantic v2** - Data validation and settings management
- **JWT Authentication** - Secure token-based authentication
- **CORS Support** - Configured for frontend integration
- **Docker & Docker Compose** - Containerized development environment

### Backend Features

- RESTful API for blog management
- User authentication and authorization
- Article CRUD operations with publishing workflow
- Comment system with threading and moderation
- Pagination, search, and filtering
- Automated API documentation (Swagger UI at `/docs`)

## Getting Started

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Backend Setup

#### Option 1: Local Development (Recommended)

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/Mac
python -m venv .venv
source .venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. Run database migrations:
```bash
alembic upgrade head
```

6. Start the development server:
```bash
uvicorn app.main:app --reload --port 8989
```

The API will be available at [http://localhost:8989](http://localhost:8989) with documentation at [http://localhost:8989/docs](http://localhost:8989/docs).

#### Option 2: Docker Compose (All-in-one)

1. From the project root, start all services:
```bash
docker-compose up
```

This will start:
- PostgreSQL database on port 5432
- FastAPI backend on port 8989

2. Access the API at [http://localhost:8989](http://localhost:8989)

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

The backend uses PostgreSQL by default with the following credentials (configured in docker-compose.yml):

- **Host**: localhost
- **Port**: 5432
- **Database**: my_awesome_blog
- **Username**: postgres
- **Password**: 123456

For development with SQLite, update `DATABASE_URL` in `.env` file.

### Windows-specific Database Setup

If you're running on Windows, we provide automated tools to help set up your PostgreSQL database:

```bash
# Step 1: Diagnose database connection
cd backend
python scripts/diagnose_db.py

# Step 2: Fix any issues found
python scripts/fix_db_connection.py



These tools will help you:
- Check PostgreSQL service status
- Verify database connection
- Create missing databases automatically
- Initialize table structure
- Update connection credentials

For detailed instructions, see [Backend README](./backend/README.md#database-setup-tools-windows-specific).

## Testing

### Backend Tests

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install test dependencies:
```bash
pip install -r requirements-test.txt
```

3. Run tests:
```bash
pytest
```

### Frontend Tests

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Run tests:
```bash
npm test
```

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

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.