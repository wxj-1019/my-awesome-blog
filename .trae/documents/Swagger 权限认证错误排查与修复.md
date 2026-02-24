## Swagger 权限认证错误排查方案

### 问题分析
错误信息：`auth errorTypeError: Failed to fetch`

可能原因：
1. **Token 验证失败**：JWT token 无效或过期
2. **数据库查询失败**：用户不存在或数据库连接问题
3. **依赖注入错误**：`get_current_active_user` 依赖链中的某个环节出错
4. **Swagger UI 配置问题**：认证配置不正确

### 排查步骤

#### 1. 检查 Swagger 认证配置
- 查看 [api_docs.py](file:///e:\A_Project\my-awesome-blog\backend\app\utils\api_docs.py) 中的 OAuth2 配置
- 确认 `tokenUrl` 路径正确：`/api/v1/auth/login`
- 检查安全方案定义是否正确

#### 2. 检查依赖注入链
- 查看 [dependencies.py](file:///e:\A_Project\my-awesome-blog\backend\app\core\dependencies.py) 中的认证逻辑
- 确认 `get_current_user` → `get_current_active_user` 链路正确
- 检查 token 验证和用户查询逻辑

#### 3. 检查端点配置
- 查看 [users.py](file:///e:\A_Project\my-awesome-blog\backend\app\api\v1\endpoints\users.py#L106) 中的 `/me` 端点
- 确认依赖注入正确：`Depends(get_current_active_user)`
- 检查错误处理是否完善

#### 4. 检查数据库连接
- 确认数据库服务正常运行
- 检查用户表是否存在
- 验证用户数据完整性

### 修复方案

#### 方案一：增强错误处理
在 `get_current_user` 中添加更详细的错误日志：
- 记录 token 验证失败的详细信息
- 记录数据库查询失败的详细信息
- 添加更友好的错误消息

#### 方案二：修复 Swagger 配置
如果 OAuth2 配置有问题：
- 更新 `tokenUrl` 为正确的登录端点
- 添加正确的 scopes 定义
- 确保安全方案与实际认证逻辑匹配

#### 方案三：添加调试日志
在关键位置添加日志：
- 记录每次认证尝试
- 记录 token 解析结果
- 记录用户查询结果

### 具体修改内容

1. **增强依赖注入错误处理**
2. **改进 Swagger OAuth2 配置**
3. **添加详细的认证日志**
4. **优化错误消息格式**

### 预期效果
- 能够准确定位错误来源
- 提供更友好的错误提示
- Swagger UI 能够正确处理认证流程
- 便于后续调试和维护