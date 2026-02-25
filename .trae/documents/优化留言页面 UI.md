## 优化留言页面 UI

### 1. 移除 hover 放大效果

从以下组件中移除 `hover:scale-*` 类：
- `UserLevelBadge.tsx` (line 79): 移除 `hover:scale-110`
- `MessageReactions.tsx` (line 101): 移除 `hover:scale-110`
- `MessageInput.tsx` (line 218): 移除 `hover:scale-125`
- `MessageInput.tsx` (line 246): 移除 `hover:scale-110`

### 2. 优化消息提示框样式

改进 `toaster.tsx` 组件的样式：
- 使用 glassmorphism 设计风格
- 添加更好的视觉层次和动画效果
- 改进按钮和图标的可访问性
- 适配暗色主题
- 添加更平滑的进入/退出动画

### 文件修改列表
1. `frontend/src/components/messages/UserLevelBadge.tsx`
2. `frontend/src/components/messages/MessageReactions.tsx`
3. `frontend/src/components/messages/MessageInput.tsx`
4. `frontend/src/components/ui/toaster.tsx`