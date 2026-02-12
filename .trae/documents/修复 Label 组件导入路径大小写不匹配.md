## 修复 Label 组件导入路径大小写不匹配问题

### 问题分析
- 实际文件名：`label.tsx`（小写）
- 导入路径：`@/components/ui/Label`（大写 L）
- 影响文件：
  - `ProfileView.tsx`
  - `SettingsView.tsx`
  - `EditModeForm.tsx`

### 修改计划

**方案：重命名文件为大写（符合组件命名约定）**

1. 将 `label.tsx` 重命名为 `Label.tsx`
   - 符合 PascalCase 组件命名约定
   - 与其他 UI 组件（如 `Button.tsx`, `input.tsx`）保持一致

2. 验证所有导入路径正确使用 `@/components/ui/Label`

### 修复效果
- 解决构建错误
- 保持代码风格一致性