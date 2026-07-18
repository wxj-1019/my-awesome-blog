# 安全清理清单（2026-07-18）

> 本清单对应仓库内曾出现的明文部署凭证与被跟踪的环境文件。
> **代码清理 ≠ 凭证失效**：只要密钥曾进过 Git 历史或被推送，必须轮换。

## 已完成的仓库侧清理

- [x] 从 Git 索引移除（本地文件保留）：
  - `.env.production`
  - `frontend/.env.production`
  - `backend/.env.bak`
  - `how HEAD`（误提交的 git log 输出）
- [x] 加强 `.gitignore`：`.env.*`、`.env.bak`、本地 Agent 目录、误放日志
- [x] 新增示例配置：`.env.production.example`（无真实密钥）
- [x] 根目录约 50+ 个一次性运维脚本（含曾硬编码 SSH 密码的 `deploy_*.py` / `check_*.py` 等）**已从仓库删除**
- [x] 仅保留 `deploy.sh` / `deploy.ps1`（通过 `DEPLOY_SERVER_IP` 等环境变量 + SSH，无明文密码）
- [x] 工作区扫描：明文旧密码命中为 0

## 你必须立刻在机器/云上执行的操作

### 1. 轮换服务器访问

- [ ] 修改服务器 `root`（及所有曾用该密码的账号）密码
- [ ] 优先改用 **SSH 公钥登录**，禁用密码登录（`PasswordAuthentication no`）
- [ ] 检查 `/var/log/auth.log` 或等价日志是否有异常登录
- [ ] 若密码曾推送到 GitHub/其他远程：**视为已泄露**，即使后来删文件也要轮换

### 2. 轮换应用密钥

对照本地仍存在的 `.env.production` / `backend/.env`（勿再提交），逐项轮换：

- [ ] `POSTGRES_PASSWORD` + 更新 `DATABASE_URL`
- [x] `SECRET_KEY`（JWT，至少 32 字符随机串）— **本地**已于 2026-07-18 轮换；**生产服务器**仍须按 `docs/production-env-checklist.md` 同步并重启
- [ ] `DEEPSEEK_API_KEY` / `GLM_API_KEY` / `QWEN_API_KEY`（若曾写入）
- [ ] 阿里云 `ALIBABA_CLOUD_ACCESS_KEY_*`（若曾写入）
- [ ] Redis 密码（若生产启用）
- [ ] 其他第三方 Token

完整生产核对步骤见：**[docs/production-env-checklist.md](./production-env-checklist.md)**

### 3. Git 历史（若曾 push 含密钥的提交）

仅从当前树删除不够，历史中仍可读出密钥：

```bash
# 推荐：git-filter-repo（需单独安装）
# 在克隆的干净副本上操作，并强制协调所有协作者

git filter-repo --path .env.production --invert-paths
git filter-repo --path backend/.env.bak --invert-paths
# 对含明文密码的脚本路径同样处理，或整段历史重写后轮换密钥
```

- [ ] 重写后 `git push --force`（确认无人基于旧历史开发）
- [ ] 在 GitHub/GitLab 作废可能泄露的 token；检查 Actions secrets

### 4. 部署方式约定

```bash
# Git Bash 示例
export DEPLOY_SERVER_IP='x.x.x.x'
export DEPLOY_SSH_PASS='***'   # 更推荐 SSH key，不设密码
# 仅保留经审计的脚本，例如 deploy.sh / deploy.ps1（走 ssh key）
```

- [ ] 一次性 `check_*.py` / `rebuild_*.py` 勿再提交新密钥
- [ ] 生产只使用 `.env.production`（gitignore）+ Compose

## 验证命令

```bash
# 工作区不应再出现旧明文 root 密码（用你记得的旧口令片段自查）
# rg -n '<旧密码片段>' --glob '!.git/**' || echo OK

# 敏感文件应被 ignore 且不在 index
git check-ignore -v .env.production frontend/.env.production backend/.env.bak
git ls-files | rg '\.env'   # 应只剩 *.example
```

## 相关修复

- 首页统计 API 路径已统一为 `/api/v1/stats/public/overview`
- 详见 `docs/commit-split-plan.md` 中 PR-0 / PR-1
