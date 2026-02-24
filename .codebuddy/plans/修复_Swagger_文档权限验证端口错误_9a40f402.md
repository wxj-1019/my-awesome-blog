---
name: 修复 Swagger 文档权限验证端口错误
overview: 修复 api_docs.py 中的开发服务器端口配置，从 8000 改为 8989，解决 Swagger 文档权限验证时的 "Failed to fetch" 错误
todos:
  - id: fix-port-config
    content: 修改 api_docs.py 中开发服务器端口号为 8989
    status: completed
---

## 产品概述

修复 Swagger 文档权限验证功能中的配置错误，解决用户在点击 Authorize 按钮时出现的 "Failed to fetch" 错误。

## 核心功能

- 修正 API 文档中开发服务器的端口号配置
- 确保 Swagger UI 能正确访问后端服务的认证端点
- 验证修复后权限验证流程正常工作

## 技术栈

- 后端框架：FastAPI (Python)
- 修改文件：`backend/app/utils/api_docs.py`

## 实现方法

将 `backend/app/utils/api_docs.py` 文件第 40 行的开发服务器 URL 从 `http://localhost:8000` 修改为 `http://localhost:8989`，以匹配 `backend/app/main.py` 中实际运行的后端服务端口。

## 技术决策

- 端口一致性：保持 Swagger UI 服务器配置与实际运行端口一致，确保认证请求能正确路由
- 最小化修改：仅修改必要的端口配置，避免影响其他功能

## 实施说明

- 修改位置：`backend/app/utils/api_docs.py` 第 40 行
- 修改内容：端口号 8000 → 8989
- 影响范围：仅影响 Swagger UI 的服务器列表配置，不影响后端服务本身

## 架构设计

无架构变更，仅修复配置不一致问题。

## 目录结构

```
e:/A_Project/my-awesome-blog/
└── backend/
    └── app/
        └── utils/
            └── api_docs.py  # [MODIFY] 第 40 行，将端口从 8000 改为 8989
```