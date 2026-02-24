# 迁移测试指南

## 环境检查

在执行迁移前，请确保：

1. **PostgreSQL 数据库正在运行**
   ```bash
   # 检查服务状态
   # Windows: 检查服务管理器中的 PostgreSQL 服务
   # Linux/Mac: sudo systemctl status postgresql
   ```

2. **环境变量已配置**
   ```bash
   cd backend
   type .env | findstr DATABASE_URL
   # 应该看到类似: DATABASE_URL=postgresql://postgres:password@localhost:5432/my_awesome_blog
   ```

3. **Python 依赖已安装**
   ```bash
   cd backend
   pip list | findstr alembic
   pip list | findstr sqlalchemy
   pip list | findstr psycopg2
   ```

## 测试步骤

### 方法 1: 使用状态检查脚本

```bash
cd backend
python migration_status.py
```

这将检查：
- 数据库连接
- Alembic 配置
- 当前迁移版本
- 可用的迁移历史

### 方法 2: 手动执行测试

```bash
cd backend

# 1. 检查当前版本
alembic current

# 2. 查看迁移历史
alembic history

# 3. 执行迁移
alembic upgrade head

# 4. 验证迁移
alembic current
```

### 方法 3: 使用迁移助手

```bash
cd backend
python migration_helper.py current
python migration_helper.py upgrade
```

## 预期结果

### 迁移前状态

```
Current revision: 010
```

### 执行迁移后状态

```
Current revision: 011 (head)
```

## 验证迁移

### 1. 检查数据库结构

```sql
-- 连接到数据库
psql -U postgres -d my_awesome_blog

-- 检查 typewriter_contents 表
\d typewriter_contents

-- 检查 weather 表
\d weather
```

应该看到 `id` 列是 `uuid` 类型。

### 2. 测试数据插入

使用 Swagger UI 或 API 测试工具：

```bash
# 测试 typewriter_contents
curl -X POST http://127.0.0.1:8989/api/v1/typewriter-contents/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "测试文本", "priority": 1, "is_active": true}'
```

应该成功创建记录，返回的 id 应该是 UUID 格式。

### 3. 测试数据查询

```bash
# 查询 typewriter_contents
curl -X GET http://127.0.0.1:8989/api/v1/typewriter-contents/ \
  -H "accept: application/json"
```

## 常见问题

### 问题 1: "No module named 'alembic'"

**解决方案：**
```bash
cd backend
pip install -r requirements.txt
```

### 问题 2: "FATAL: database does not exist"

**解决方案：**
```sql
-- 创建数据库
createdb -U postgres my_awesome_blog

# 或者使用 psql
psql -U postgres
CREATE DATABASE my_awesome_blog;
```

### 问题 3: "FATAL: password authentication failed"

**解决方案：**
检查 `.env` 文件中的数据库密码是否正确。

### 问题 4: 迁移已经应用

如果看到类似消息：
```
Target database is not up to date: 010 -> 011
```

这说明迁移还没应用，继续执行即可。

如果看到：
```
Database is up to date
```

说明迁移已经应用过了。

### 问题 5: 迁移失败

如果迁移失败，检查：

1. **日志文件**
   ```bash
   type logs\app.log
   ```

2. **回滚迁移**
   ```bash
   cd backend
   alembic downgrade -1
   ```

3. **重新执行**
   ```bash
   alembic upgrade head
   ```

## 回滚迁移

如果需要回滚迁移：

```bash
cd backend
alembic downgrade -1
```

## 完整测试流程示例

```bash
# 1. 进入 backend 目录
cd e:/A_Project/my-awesome-blog/backend

# 2. 检查数据库连接
python check_db.py

# 3. 检查迁移状态
alembic current

# 4. 查看迁移历史
alembic history

# 5. 执行迁移
alembic upgrade head

# 6. 验证迁移
alembic current

# 7. 测试应用
python start_server.py
```

## 成功标志

迁移成功的标志：

1. ✅ `alembic current` 显示版本为 `011`
2. ✅ 数据库表结构正确（id 字段为 uuid）
3. ✅ 应用正常启动
4. ✅ API 接口可以正常创建和查询数据
5. ✅ Swagger UI 可以正常测试接口

## 下一步

迁移成功后：

1. 重启应用服务器
2. 测试所有相关接口
3. 验证前端功能正常
4. 提交代码到版本控制

## 需要帮助？

如果遇到问题：

1. 查看日志文件：`backend/logs/app.log`
2. 查看文档：`backend/docs/DATABASE_MIGRATION.md`
3. 联系开发团队
