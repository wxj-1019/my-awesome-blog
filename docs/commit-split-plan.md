# 未提交变更拆分提交计划

> 生成日期：2026-07-18  
> 背景：工作区约 **360+** 文件改动（审查时约 `+6405 / -16205`），不宜单次巨型 commit。

## 原则

1. **先安全、后功能**：含密钥/清理的提交最先，且可单独 review。
2. **每个 PR 可独立验证**：能跑对应 lint/test/build。
3. **不把根目录一次性脚本与业务代码混提**。
4. 暂不 `git add .`；按路径点名添加。

---

## PR-0：安全止血（本批优先）

**目标**：凭证不再进库；ignore 生效；运维脚本无明文密码。

| 纳入 | 说明 |
|------|------|
| `.gitignore` | env / agent 目录 / 误放文件 |
| `.env.production.example` | 无密钥模板 |
| `docs/security-cleanup-checklist.md` | 轮换清单 |
| 被 `git rm --cached` 的：`.env.production`、`frontend/.env.production`、`backend/.env.bak`、`how HEAD` | 仅删索引 |
| 根目录一次性运维脚本 | **已删除**，仅保留 `deploy.sh` / `deploy.ps1`（SSH key / 环境变量） |

**建议提交信息：**

```text
security: remove tracked secrets and scrub deploy credentials

- stop tracking production env files and .env.bak
- harden .gitignore for .env.* and local agent dirs
- replace hardcoded SSH passwords with DEPLOY_* env vars
- add rotation checklist and .env.production.example
```

**验证：**

```bash
git ls-files | rg '\.env'          # 仅 example
# 用旧口令片段自查：rg -n '<旧密码片段>' || true  → 应无命中
```

**你本地必做（不在 commit 内）：** 按 checklist 轮换服务器与 DB/JWT 密钥。

**可选强化（仍属 PR-0）：** 直接 `git rm` 删除 40+ 一次性脚本，只保留 `deploy.sh` / `deploy.ps1`。

---

## PR-1：首页统计契约修复

| 纳入 | 说明 |
|------|------|
| `frontend/src/services/statisticsService.ts` | `/statistics/...` → `/stats/...` |
| `frontend/src/components/home/StatsPanel.tsx` | 调用 `getPublicStatistics`，图表接真实/降级数据 |
| （可选）`docs/optimization-status.md` 一句同步 | 路径已对齐 |

**提交信息：**

```text
fix(home): align public stats API path and wire StatsPanel

Use /api/v1/stats/public/overview; fall back to labeled sample charts
when the public endpoint is empty or unavailable.
```

**验证：**

```bash
# 后端启动后
curl -s http://localhost:8989/api/v1/stats/public/overview | head

cd frontend && npm run type-check
# 浏览器打开首页，Network 应见 /stats/public/overview 而非 /statistics/...
```

---

## PR-2：后端行为/测试（当前 diff 中的 backend）

按主题再拆（示例）：

| 子提交 | 路径线索 |
|--------|----------|
| 2a 异常与依赖 | `backend/app/core/*`、`exception_handlers` |
| 2b 模型软删除/字段 | `backend/app/models/*` |
| 2c CRUD/分页 | `backend/app/crud/*`、`utils/pagination.py` |
| 2d 端点 | `backend/app/api/v1/endpoints/*` |
| 2e 测试 | `backend/app/tests/*` |
| 2f 依赖 | `backend/requirements.txt` |

**验证：**

```bash
cd backend && pytest -q
```

**注意：** `tenants.py` 若仍未挂到 `router.py`，要么注册要么别提交半成品。

---

## PR-3：前端主体（admin / services / styles）

| 子提交 | 路径线索 |
|--------|----------|
| 3a API client / services | `frontend/src/lib/*`、`services/*` |
| 3b 页面与组件 | `frontend/src/app/*`、`components/*` |
| 3c 样式主题 | `frontend/src/styles/*`、`tailwind.config.js` |
| 3d 测试与配置 | `frontend/__tests__`、eslint/tsconfig 等 |

**验证：**

```bash
cd frontend
npm run lint
npm run type-check
npm test
npm run build
```

---

## PR-4：文档与规则

- `AGENTS.md`、`QWEN.md`、`README.md`、`docs/rules/*`、`docs/optimization-status.md`
- 避免把 `docs/111.md` 这类杂文件继续膨胀提交

---

## PR-5：部署与 Compose（无密钥）

- `docker-compose.yml` / `docker-compose.prod.yml`
- `deploy.sh` / `deploy.ps1` / `deploy-password.bat`（已读 env 的版本）
- **不要**提交真实 `.env.production`

建议 prod compose 去掉写死的 `192.168.100.12` 默认值（可顺手放本 PR）。

---

## PR-6：仓库卫生（可选独立）

```bash
# 示例：删除根目录一次性脚本（确认无用后）
git rm check_*.py rebuild_*.py verify_*.py ...
# 或移到 scripts/archive/ 且不进入默认文档入口
```

- 删除已标记删除的 `.github/workflows/ci.yml`（若确认由前后端分拆 CI 替代）
- 删除根目录遗留 `package.json` / `package-lock.json`（若 intentional）

---

## 推荐操作顺序（命令示意）

```bash
# --- PR-0 ---
git add .gitignore .env.production.example docs/security-cleanup-checklist.md
git add -u .env.production frontend/.env.production backend/.env.bak "how HEAD"
# 去密脚本：要么 add 全部已改脚本，要么 git rm 删除
git add deploy_to_server.py verify_backend.py  # ... 或批量
# git commit ...

# --- PR-1 ---
git add frontend/src/services/statisticsService.ts \
        frontend/src/components/home/StatsPanel.tsx
# git commit ...

# 其余用 pathspec 分批，避免 git add .
```

## 风险提示

| 风险 | 处理 |
|------|------|
| 历史中仍有密钥 | filter-repo + 轮换，见 security checklist |
| 巨型 backend/frontend 混在一起 | 严格 pathspec；一个 PR 只跑一侧 CI |
| 去密脚本仍可被误用空密码连接 | 关键脚本（如 `deploy_to_server.py`）已 `sys.exit`；其他可再加校验或删除 |

## 完成定义

- [ ] PR-0 合并后 `git ls-files` 无真实 env
- [ ] 密钥已在服务器与云控制台轮换
- [ ] 首页 Network 请求 `/stats/public/overview` 且 200（或有合理降级）
- [ ] 后端 `pytest`、前端 lint/type-check/test/build 在对应 PR 绿
