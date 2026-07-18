# Release notes — local main (7 commits ahead of origin)

> 生成：2026-07-18  
> 范围：`origin/main` → `HEAD`（`b8c7b31`）  
> **未 push**。推送前请完成密钥轮换与（如需）历史清理。

## Commits

1. `2f13ef1` **security**: remove tracked secrets and one-off deploy scripts  
2. `c1e5396` **fix(home)**: align public stats API path and wire StatsPanel  
3. `647c13a` **feat(backend)**: UUID dialect compatibility, public stats, API hardening  
4. `3f092b2` **feat(frontend)**: homepage polish, SEO routes, admin/services cleanup  
5. `e3e2b08` **docs**: refresh agent rules and project documentation  
6. `f349dc6` **chore**: harden compose bind addresses and repo hygiene  
7. `b8c7b31` **chore**: stop tracking frontend tsbuildinfo artifact  

## Highlights

### Security
- Untrack `.env.production` / `frontend/.env.production` / `backend/.env.bak`
- Delete 50+ one-off ops scripts that embedded SSH credentials
- Keep only `deploy.sh` / `deploy.ps1` (env + SSH)
- Add `.env.production.example` and `docs/security-cleanup-checklist.md`

### Backend
- Cross-dialect `UUIDType` (PostgreSQL + SQLite tests)
- Unified exception handlers; public stats `GET /api/v1/stats/public/overview`
- Article cursor pagination, fulltext search, recommended list, etc.
- LangChain deps aligned to 0.3.x line
- Tests: **134 passed, 4 skipped**

### Frontend
- StatsPanel uses `/stats/public/overview` with labeled sample fallback
- Page metadata splits (`*-content.tsx`), sitemap / robots / RSS
- Home / admin / services cleanup; ESLint **0 errors**
- Type-check and production **build** green

### Infra / docs
- Dev Compose: Postgres/Redis bind `127.0.0.1`
- Remove root `package.json` and obsolete `.github/workflows/ci.yml`
- Modular rules under `docs/rules/*`

## Verification

```bash
cd backend && .venv/Scripts/python.exe -m pytest app/tests -q
# 134 passed, 4 skipped

cd frontend
npm run type-check   # pass
npm run lint         # 0 errors
npm run build        # pass (routes include /sitemap.xml /robots.txt /feed.xml)
```

## Push checklist (do before `git push`)

- [ ] Rotate server root password / prefer SSH keys  
- [ ] Rotate `POSTGRES_PASSWORD`, `SECRET_KEY`, LLM/OSS keys that ever lived in git  
- [ ] Remember: **deleting files in new commits does not erase secrets from old history**  
  - If repo was ever public or shared, run history rewrite (`git filter-repo`) then force-push with team coordination  
- [ ] Confirm local `.env.production` still exists for deploy (gitignored)  
- [ ] `git push origin main` (or open PR from a branch)

## Suggested PR title

```text
security + full-stack cleanup: secrets out, stats path fix, UUID/tests, home SEO
```

## Suggested PR body (copy)

```markdown
## Summary
- Remove tracked env secrets and one-off password-bearing deploy scripts; keep deploy.sh/ps1 only.
- Fix homepage public stats path (`/api/v1/stats/public/overview`) and wire StatsPanel.
- Backend: cross-dialect UUID, exception consolidation, stats/article APIs, test suite green.
- Frontend: SEO routes, content splits, services/home polish; lint 0 errors; build passes.
- Docs/rules refresh; compose localhost binds; repo hygiene.

## Test plan
- [x] backend pytest 134 passed / 4 skipped
- [x] frontend type-check
- [x] frontend lint (0 errors)
- [x] frontend production build
- [ ] manual: curl /api/v1/stats/public/overview
- [ ] manual: homepage Network shows /stats/public/overview
- [ ] ops: credential rotation (required)

## Security note
Prior commits on origin may still contain secrets in history. Rotate all exposed credentials even after merge.
```
