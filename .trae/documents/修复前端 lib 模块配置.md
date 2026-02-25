## 修复前端 lib 模块导入问题

### 问题分析

前端项目存在多个 `lib` 相关的配置问题：

1. **环境变量命名不一致**：
   - `env.ts` 中定义了 `NEXT_PUBLIC_API_URL` 和 `NEXT_PUBLIC_API_BASE_URL`
   - `api-client.ts` 使用 `NEXT_PUBLIC_API_URL`
   - 但 `.env.production.example` 使用 `NEXT_PUBLIC_API_BASE_URL`

2. **lib 模块结构**：
   - `src/lib/env.ts` - 环境变量
   - `src/lib/api-client.ts` - 通用 API 请求
   - `src/lib/api.ts` - 打字机内容 API（独立）
   - `src/lib/api/` - 各个模块的 API

3. **tsconfig.json 路径别名正确**：
   - `"@/lib/*": ["./src/lib/*"]`

### 修复方案

1. **统一环境变量命名**：将 `NEXT_PUBLIC_API_URL` 改为 `NEXT_PUBLIC_API_BASE_URL` 保持一致性
2. **更新 `.env.production.example`**：添加 `NEXT_PUBLIC_API_URL` 以匹配代码中的使用
3. **添加 `.env.development.example`**：提供开发环境配置模板
4. **创建 lib 模块索引**：统一导出所有 lib 功能

这样可以确保新拉取项目的用户有正确的配置模板，避免 lib 模块获取不到的问题。