# 生产环境 E2E 清单（推送后）

> 目标环境：`http://49.234.190.85`  
> 最近相关提交：`8988267`（深海×电影首页 / 公开页壳 / 去订阅卡）  
> 更新：2026-07-20

## 0. 部署后自动烟雾（应已通过）

在服务器或本机执行：

```bash
BASE=http://49.234.190.85

curl -sS -o /dev/null -w "HOME=%{http_code}\n" "$BASE/"
curl -sS -w "\nHEALTH=%{http_code}\n" "$BASE/health"
curl -sS -o /dev/null -w "DOCS=%{http_code}\n" "$BASE/docs"
curl -sS -o /dev/null -w "ABOUT=%{http_code}\n" "$BASE/about"
curl -sS -o /dev/null -w "ARTICLES_API=%{http_code}\n" "$BASE/api/v1/articles/?limit=3&offset=0"
```

期望：

| 路径 | 期望 |
|------|------|
| `/` | 200 |
| `/health` | 200，JSON 含 `"status":"healthy"` |
| `/docs` | 200 |
| `/about` | 200 |
| `/api/v1/articles/?limit=3` | 200，JSON 数组或分页对象 |

---

## 1. 首页叙事（深海 × 电影）

在浏览器打开 `http://49.234.190.85/`（建议 Chrome + 无痕）。

| # | 检查项 | 通过标准 | □ |
|---|--------|----------|---|
| 1.1 | 片头 Hero | 全屏视频/渐变 + 打字机文案；可滚动 | □ |
| 1.2 | 入水 | Hero 底波浪 + 向下有色带过渡，不硬切成白页 | □ |
| 1.3 | 第一幕 · 展厅 | 可见「第一幕 · 展厅」；横向胶片卷轴 | □ |
| 1.4 | 卷轴交互 | 箭头/点可切换；桌面可拖；键盘聚焦后 ←/→ | □ |
| 1.5 | 卷轴点击 | 点击卡片进入文章详情（非拖拽误触） | □ |
| 1.6 | 第二幕 · 仪表 | 统计面板 + 技术栈；Logo 默认不狂滚（悬停可动） | □ |
| 1.7 | 第三幕 · 航迹 | 阅读统计区域正常 | □ |
| 1.8 | 第三幕 · 洋流 | 时间线 + 中轴洋流线随滚动有进度感 | □ |
| 1.9 | 第四幕 · 靠岸 | **港口航标**，入口：文章 / 留言 / 关于 | □ |
| 1.10 | 无订阅 | **无**邮箱订阅表单；无「订阅成功」类 UI | □ |
| 1.11 | 无矩阵雨 | 暗色模式下无全屏绿色代码雨 | □ |
| 1.12 | 回顶 | 「回到海面」滚到顶部 | □ |
| 1.13 | 减少动态 | 系统开启「减少动态效果」后页面仍可用、无异常狂闪 | □ |

---

## 2. 公开页壳（PageShell 批次）

| # | 页面 | 检查项 | □ |
|---|------|--------|---|
| 2.1 | `/about` | 玻璃卡气质；标题区统一；light/dark 可读 | □ |
| 2.2 | `/login` | 可打开；无整块硬编码黑半透明导致浅色不可读 | □ |
| 2.3 | `/home` | hub 卡片入口：音乐/视频/游戏 | □ |
| 2.4 | `/tools` | hub：对话/在线工具 | □ |
| 2.5 | `/unauthorized` | 文案 + 前往登录可点 | □ |

---

## 3. 内容主路径

| # | 检查项 | 通过标准 | □ |
|---|--------|----------|---|
| 3.1 | `/articles` | 列表加载；筛选/滚动不白屏 | □ |
| 3.2 | 文章详情 | 从列表或卷轴进入；正文/目录可用 | □ |
| 3.3 | `/messages` | 留言板可打开 | □ |
| 3.4 | `/contact` | 联系页可打开 | □ |
| 3.5 | RSS | `/feed.xml` 返回 XML（200） | □ |

---

## 4. 认证（可选，有账号时）

| # | 检查项 | □ |
|---|--------|---|
| 4.1 | `/login` 正确账号可登录并跳转 | □ |
| 4.2 | 错误密码有错误提示 | □ |
| 4.3 | `/profile` 登录后可进，未登录应被拦或引导 | □ |
| 4.4 | `/admin` 管理员可进；非管理员不可乱进 | □ |

---

## 5. API / 运维

| # | 检查项 | 命令/方式 | □ |
|---|--------|-----------|---|
| 5.1 | 健康 | `curl -s $BASE/health` → healthy | □ |
| 5.2 | OpenAPI | 打开 `$BASE/docs` 可加载 | □ |
| 5.3 | 文章 API | `curl -s "$BASE/api/v1/articles/?limit=3"` | □ |
| 5.4 | 容器状态 | 服务器：`docker compose -f /opt/my-awesome-blog/docker-compose.prod.yml ps` 全 Up/healthy | □ |
| 5.5 | 后端日志无刷屏 Traceback | `docker compose ... logs --tail=50 backend` | □ |

---

## 6. 回归雷区（本次改动相关）

| 风险 | 如何确认 |
|------|----------|
| 订阅卡残留 | 首页搜索「订阅邮箱」/ 输入框 type=email 用于订阅 |
| 矩阵雨 | 暗色首页背景无字符雨 canvas |
| 双层 main / 布局塌陷 | 导航+页脚正常；内容不被裁切 |
| CORS | 浏览器控制台访问 API 无 CORS 红错（同源经 nginx 通常无此问题） |
| 构建期 API 不可达 | 文章列表运行时仍可拉取即可（构建时 ECONNREFUSED 可忽略若运行时 200） |

---

## 7. 失败时快速命令

```bash
ssh root@49.234.190.85
cd /opt/my-awesome-blog
# 若 CORS 问题，带上 override：
# export BACKEND_CORS_ORIGINS='["http://49.234.190.85"]'
docker compose -f docker-compose.prod.yml -f docker-compose.cors-fix.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 backend
docker compose -f docker-compose.prod.yml logs --tail=50 nginx
docker compose -f docker-compose.prod.yml restart nginx
```
