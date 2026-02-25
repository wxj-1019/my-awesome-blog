# 数据库迁移指南

## 概述

本项目使用 Alembic 进行数据库迁移管理。启动服务器时会自动运行迁移，也可以手动执行。

## 迁移文件

### 最新迁移: 011_convert_typewriter_and_weather_to_uuid

此迁移将以下表的 `id` 字段从 `Integer` 类型转换为 `UUID` 类型：
- `typewriter_contents`
- `weather`

**注意事项：**
- 现有数据会被重新分配新的 UUID
- 原有的 Integer ID 将不再有效
- 建议在生产环境执行前备份数据库

## 使用方法

### 方法 1: 自动迁移（推荐）

直接启动服务器，迁移会自动执行：

```bash
cd backend
python start_server.py
```

启动脚本会：
1. 检查并执行待执行的迁移
2. 显示迁移进度
3. 启动应用服务器

### 方法 2: 手动迁移

如果需要在启动前单独执行迁移：

```bash
cd backend
python run_migrations.py
```

### 方法 3: 使用 Alembic CLI

直接使用 Alembic 命令行工具：

```bash
cd backend

# 查看当前版本
alembic current

# 升级到最新版本
alembic upgrade head

# 升级到特定版本
alembic upgrade 011

# 回滚到上一个版本
alembic downgrade -1

# 查看迁移历史
alembic history

# 查看迁移状态
alembic show
```

## 禁用自动迁移

如果需要在启动时跳过迁移，可以修改启动代码或使用 `run_db_migration=False` 参数：

```python
from start_server import ServerStarter

starter = ServerStarter()
starter.start(run_db_migration=False)  # 禁用自动迁移
```

## 故障排查

### 迁移失败

如果迁移失败，请检查：

1. **数据库连接**
   ```bash
   # 检查 PostgreSQL 是否运行
   psql -U postgres -h localhost
   ```

2. **环境变量**
   ```bash
   # 确认 .env 文件中的 DATABASE_URL 正确
   cat .env | grep DATABASE_URL
   ```

3. **迁移状态**
   ```bash
   # 查看当前迁移版本
   cd backend
   alembic current
   ```

4. **日志文件**
   ```bash
   # 查看日志获取详细错误信息
   tail -f logs/app.log
   ```

### 迁移已执行

如果提示迁移已存在，可能是因为：

- 迁移已经被应用过
- 使用了不同的 Alembic 版本控制
- 数据库已手动修改过

**解决方法：**

```bash
# 方法 1: 标记迁移为已完成
alembic stamp head

# 方法 2: 回滚并重新执行
alembic downgrade base
alembic upgrade head
```

## 开发新迁移

### 1. 生成迁移文件

```bash
cd backend
alembic revision --autogenerate -m "描述迁移内容"
```

### 2. 编辑迁移文件

在 `backend/alembic/versions/` 目录下找到生成的迁移文件，编辑 `upgrade()` 和 `downgrade()` 函数。

### 3. 测试迁移

```bash
# 升级
alembic upgrade head

# 回滚
alembic downgrade -1
```

### 4. 提交代码

提交迁移文件和相关的模型修改。

## 最佳实践

1. **始终在开发环境测试迁移**
   - 先在本地或测试环境验证迁移脚本
   - 确保可以成功回滚

2. **添加描述性注释**
   - 在迁移文件中添加清晰的注释
   - 说明为什么要进行此迁移

3. **处理数据迁移**
   - 对于影响现有数据的迁移，编写数据转换逻辑
   - 提供回滚脚本

4. **备份数据库**
   - 在生产环境执行迁移前备份数据
   - 测试备份恢复流程

5. **版本控制**
   - 将所有迁移文件提交到版本控制
   - 不要修改已应用的迁移文件

## 迁移脚本结构

```python
"""迁移描述

Revision ID: XXX
Revises: YYY
Create Date: YYYY-MM-DD HH:MM:SS.SSSSSS

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'XXX'  # 当前版本号
down_revision = 'YYY'  # 依赖的上一个版本
branch_labels = None
depends_on = None


def upgrade() -> None:
    """应用迁移"""
    # 编写升级逻辑
    pass


def downgrade() -> None:
    """回滚迁移"""
    # 编写回滚逻辑
    pass
```

## 相关文件

- `backend/alembic/` - Alembic 配置目录
- `backend/alembic.ini` - Alembic 配置文件
- `backend/alembic/versions/` - 迁移文件目录
- `backend/start_server.py` - 服务器启动脚本（包含自动迁移）
- `backend/run_migrations.py` - 手动迁移脚本

## 获取帮助

如果遇到问题：

1. 查看日志：`tail -f logs/app.log`
2. 检查 Alembic 文档：https://alembic.sqlalchemy.org/
3. 联系开发团队
