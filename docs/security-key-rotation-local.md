# 本地密钥轮换记录（P0）

日期：2026-07-18

## 已轮换（本地/仓库外 env）

- `backend/.env` → `SECRET_KEY`（JWT 签发密钥）
- `.env.production` → `SECRET_KEY`（生产示例/本地生产配置副本）

## 未轮换（按用户要求）

- 服务器 root / SSH / 主机登录密码（无法轮换）
- 数据库密码、Redis 密码（若生产已单独管理，请在服务器侧自行轮换）
- 第三方 API Key（OpenAI 等，需在对应平台控制台轮换）

## 影响与后续

1. 轮换 `SECRET_KEY` 后，**所有已签发 JWT 立即失效**，用户需重新登录。
2. 生产服务器需同步更新对应 env 并重启后端容器/进程（逐步清单：`docs/production-env-checklist.md`）。
3. 历史 git 中若仍有旧密钥，建议后续 `git filter-repo` 或将仓库视为已泄露并依赖轮换。
4. 前端 `auth_token` cookie 与 localStorage 同步：
   - 登录 `setToken` 即时写入 cookie
   - 根布局 `AuthCookieSync` 启动时补齐 cookie
   - 未登录访问 `/admin` 会被 middleware 重定向到 `/login`

## 生产同步（摘要）

```bash
# 服务器上编辑 .env.production 的 SECRET_KEY 后：
docker compose -f docker-compose.prod.yml up -d --force-recreate backend
```

## 生成方式

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```
