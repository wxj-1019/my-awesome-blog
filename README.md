# My Awesome Blog

Enterprise-grade **personal site / blog** monorepo: **Next.js 16** frontend + **FastAPI** backend, with CMS admin, AI writing assistant (chat + polish), memory/prompts, and media hubs.

> **Tenant note:** `User.tenant_id` is required and used mainly by AI-side scopes (prompts/memories/conversations). Content APIs (articles, comments, …) are **single-site**, not multi-tenant SaaS isolation.

> **AI agents:** follow [`AGENTS.md`](./AGENTS.md) and [`docs/rules/`](./docs/rules/).  
> **Change history (agents):** [`docs/changelog-agents.md`](./docs/changelog-agents.md)

## Stack

| Layer | Tech | Port |
|-------|------|------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS | 3000 |
| Backend | FastAPI, SQLAlchemy 2.0, Pydantic v2 | **8989** |
| Database | PostgreSQL 15 (prod) / SQLite (tests only) | 5432 |
| Cache | Redis 7 | 6379 |
| Deploy | Docker Compose, Nginx | — |

## Repository layout

```
├── frontend/                 # Next.js App Router
├── backend/                  # FastAPI
├── docs/
│   ├── rules/                # Module rules for agents & contributors
│   └── changelog-agents.md
├── nginx/
├── docker-compose.yml        # Dev (Postgres, backend, Redis)
├── docker-compose.prod.yml
├── AGENTS.md                 # Agent entry (global rules)
└── README.md                 # This file
```

## Product surface (summary)

- **Blog:** articles (publish / featured / pin), categories, tags, comments, RSS (`/feed.xml`)
- **Site content:** portfolio, timeline, albums, friend links, typewriter copy, subscriptions, messages
- **Media hubs:** music, videos, games (`/home` hub)
- **AI:** multi-provider LLM, agent chat (**article writing aid**) + polish, conversations, memories, prompts
- **Admin:** `/admin/*` CMS, audit logs, monitoring, weather, settings
- **Infra:** JWT auth, `tenant_id` on users (AI scopes / reserved; not full multi-tenant content isolation), Redis, OSS, rate limit, schedulers

Interactive API docs when backend is running: [http://localhost:8989/docs](http://localhost:8989/docs)

## Getting started

### Prerequisites

- Node.js 20+ (recommended), npm
- Python 3.12+, pip
- Optional: Docker + Docker Compose for Postgres/Redis/backend

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Backend (local)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set DATABASE_URL, SECRET_KEY, etc. — never commit real secrets
alembic upgrade head
uvicorn app.main:app --reload --port 8989
```

API: [http://localhost:8989](http://localhost:8989) · Swagger: [http://localhost:8989/docs](http://localhost:8989/docs)

### Docker Compose (backend + Postgres + Redis)

From repo root, provide required env vars (see `docker-compose.yml` — `POSTGRES_PASSWORD`, `DATABASE_URL`, `SECRET_KEY` are required; no default production passwords in compose):

```bash
docker-compose up
```

- Postgres: `127.0.0.1:5432`
- Backend: `8989`
- Redis: `127.0.0.1:6379`

Frontend is usually run separately with `npm run dev` unless you use a full prod compose stack.

### Windows database helpers (optional)

```bash
cd backend
python scripts/diagnose_db.py
python scripts/fix_db_connection.py
```

Details: [backend/README.md](./backend/README.md).

## Core API map

Base path: `/api/v1`. Full list is registered in `backend/app/api/v1/router.py` and exposed at `/docs`.

| Area | Prefix (examples) |
|------|-------------------|
| Auth / users | `/auth`, `/users` |
| Blog | `/articles`, `/comments`, `/categories`, `/tags` |
| Site | `/messages`, `/albums`, `/portfolio`, `/friend-links`, … |
| AI | `/llm`, `/conversations`, `/memories`, `/prompts`, `/agent` |
| Ops | `/monitoring`, `/audit-logs`, `/stats`, `/tenants`, … |

## Testing

```bash
# Backend
cd backend
pip install -r requirements-test.txt   # if present
pytest

# Frontend
cd frontend
npm test
npm run lint
npm run type-check
```

## Production notes

- Set strong `SECRET_KEY`, real `DATABASE_URL`, restricted `BACKEND_CORS_ORIGINS`
- `DEBUG=False`; use PostgreSQL (not SQLite)
- Prefer `docker-compose.prod.yml` + env files that are **not** committed with secrets
- See also: `docs/production-env-checklist.md`, `docs/security-cleanup-checklist.md`

### Fast deploy (cached rebuild)

默认**不要**用 `--no-cache`。依赖层 + BuildKit 缓存挂载后，小改动通常只重建变更服务。

```bash
# 本机（需 rsync + SSH）
export DEPLOY_SERVER_IP=你的服务器IP
./deploy.sh                         # frontend + backend，用层缓存
DEPLOY_TARGET=frontend ./deploy.sh  # 只更前端
DEPLOY_TARGET=backend ./deploy.sh   # 只更后端
FORCE_NO_CACHE=1 ./deploy.sh        # 排查用全量无缓存（很慢）

# 已在服务器上改代码时
cd /opt/my-awesome-blog
bash scripts/server-redeploy.sh frontend
bash scripts/server-redeploy.sh backend
bash scripts/server-redeploy.sh all
```

## Documentation for contributors & agents

| Doc | Audience |
|-----|----------|
| [AGENTS.md](./AGENTS.md) | AI agents — global rules & commands |
| [docs/rules/](./docs/rules/) | Module coding rules |
| [docs/changelog-agents.md](./docs/changelog-agents.md) | Historical fixes |
| [backend/README.md](./backend/README.md) | Backend detail |

## License

MIT — see [LICENSE](./LICENSE).
