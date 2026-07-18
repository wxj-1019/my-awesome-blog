# 生产环境 env 核对清单

> 日期：2026-07-18  
> 用途：部署或轮换密钥后，在**服务器**上逐项确认。真实密钥只存在 gitignored 的 `.env.production` / 主机 env，**勿提交**。

## 0. 前置

```bash
# 在项目根目录（与 docker-compose.prod.yml 同级）
test -f .env.production && echo "有 .env.production" || echo "缺失：请从 .env.production.example 复制"

# Compose 会读取同目录 .env 或 export 的变量；确认启动方式：
# docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

## 1. 必填变量（缺一不可）

对照 `.env.production.example` 与 `docker-compose.prod.yml`：

| 变量 | 要求 | 本地已处理 | 生产待你确认 |
|------|------|------------|--------------|
| `SECRET_KEY` | ≥32 字符强随机；轮换后旧 JWT 全失效 | [x] 本地 `backend/.env` / `.env.production` 已轮换（2026-07-18） | [ ] 服务器已写入并与本地新值一致后重启 backend |
| `POSTGRES_PASSWORD` | 强密码，与 `DATABASE_URL` 一致 | [ ] | [ ] |
| `POSTGRES_USER` / `POSTGRES_DB` | 与库实例一致 | [ ] | [ ] |
| `DATABASE_URL` 或 Compose 拼接 | `postgresql://user:pass@postgres:5432/db` | [ ] | [ ] |
| `NEXT_PUBLIC_SITE_URL` | 公网前端 URL，无尾斜杠错误 | [ ] | [ ] |
| `NEXT_PUBLIC_API_BASE_URL` | 公网 API 入口（常与站点同域） | [ ] | [ ] |
| `BACKEND_CORS_ORIGINS` | JSON 数组字符串，含前端源 | [ ] | [ ] |
| `DEBUG` | 生产必须 `False` | [ ] | [ ] |

## 2. 推荐 / 条件必填

| 变量 | 何时需要 | 状态 |
|------|----------|------|
| `REDIS_PASSWORD` | Redis 开了 requirepass | [ ] |
| `DEEPSEEK_API_KEY` 等 | 启用 LLM | [ ] |
| `ALIBABA_CLOUD_ACCESS_KEY_*` / OSS | 启用对象存储 | [ ] |
| `EMAIL_*` | 启用邮件 | [ ] |

## 3. 部署后自检命令（在服务器执行）

```bash
# 容器是否起来
docker compose -f docker-compose.prod.yml ps

# 后端健康（按实际路径调整）
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8989/api/v1/stats/public/overview || true
# 经 nginx：
curl -sS -o /dev/null -w "%{http_code}\n" https://YOUR_DOMAIN/api/v1/stats/public/overview

# 迁移版本（进入 backend 容器）
docker compose -f docker-compose.prod.yml exec backend alembic current
# 期望：014 (head) 或更高

# 未登录访问管理后台应跳转登录（边缘 cookie 检查）
curl -sI https://YOUR_DOMAIN/admin | head -20
# 期望：302/307 到 /login?...
```

## 4. SECRET_KEY 同步步骤（生产）

1. 在**安全通道**生成新密钥：
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   ```
2. 写入服务器 `.env.production` 的 `SECRET_KEY=...`（勿 echo 进 shell 历史时可 `read` 或编辑器）。
3. 重启后端：
   ```bash
   docker compose -f docker-compose.prod.yml up -d --force-recreate backend
   ```
4. 全站用户需**重新登录**（旧 token 立即无效）。
5. 本地 `backend/.env` 若也对接同一生产库，保持与生产一致；仅本地开发库可单独密钥。

## 5. 与 cookie / 登录的关系

- 前端登录成功后 `setToken` 会写 `localStorage` + `auth_token` cookie。
- 根布局 `AuthCookieSync` 在启动时把已有 localStorage token 补写到 cookie，避免 middleware 误拦 `/admin`。
- 轮换 `SECRET_KEY` 后即使 cookie 还在，后端 JWT 校验也会失败 → `ProtectedRoute` / API 会清 token，需重新登录。

## 6. 不做的事项（按产品约定）

- 不在本清单中轮换服务器 root/SSH 密码（见 `docs/security-cleanup-checklist.md`）。
- 不把真实 `.env.production` 提交进 Git。

## 相关文件

- `.env.production.example`
- `docker-compose.prod.yml`
- `docs/security-cleanup-checklist.md`
- `docs/security-key-rotation-local.md`
- `frontend/src/lib/auth-utils.ts` / `frontend/src/components/auth/AuthCookieSync.tsx`
