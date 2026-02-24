# Admin UI Components - 使用示例

本文档展示了如何使用优化后的后台管理系统UI组件。

## 目录
- [安装依赖](#安装依赖)
- [设计系统](#设计系统)
- [LoadingState](#loadingstate)
- [EmptyState](#emptystate)
- [ConfirmDialog](#confirmdialog)
- [Toast](#toast)
- [FormInput](#forminput)
- [Button](#button)
- [DataTable](#datatable)
- [完整示例](#完整示例)

---

## 安装依赖

确保已安装以下依赖：

```bash
npm install framer-motion lucide-react
```

---

## 设计系统

### 使用设计系统

```tsx
import { AdminDesignSystem } from '@/components/admin';

// 访问颜色
const primaryColor = AdminDesignSystem.colors.primary[500];
const techCyan = AdminDesignSystem.colors.tech.cyan;

// 访问动画
const fadeInUp = AdminDesignSystem.animation.effects.fadeInUp;

// 访问间距
const spacing = AdminDesignSystem.spacing.md;
```

---

## LoadingState

### 基础用法

```tsx
'use client';

import LoadingState from '@/components/admin/LoadingState';

export default function Example() {
  return (
    <LoadingState 
      message="加载中..."
      variant="spinner"
      size="md"
    />
  );
}
```

### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| message | string | - | 加载提示文本 |
| size | 'sm' \| 'md' \| 'lg' | 'md' | 加载器大小 |
| variant | 'spinner' \| 'dots' \| 'pulse' | 'spinner' | 加载器样式 |
| className | string | - | 自定义类名 |

---

## EmptyState

### 基础用法

```tsx
'use client';

import EmptyState from '@/components/admin/EmptyState';
import { FileText, Plus } from 'lucide-react';

export default function Example() {
  return (
    <EmptyState
      title="暂无文章"
      description="创建您的第一篇文章开始写作"
      icon={FileText}
      variant="create"
      action={{
        label: '创建文章',
        onClick: () => console.log('创建'),
        icon: Plus,
      }}
    />
  );
}
```

### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| title | string | - | 标题 |
| description | string | - | 描述文本 |
| icon | ComponentType | - | 自定义图标 |
| action | object | - | 操作按钮配置 |
| variant | 'default' \| 'search' \| 'error' \| 'create' | 'default' | 变体类型 |
| className | string | - | 自定义类名 |

---

## ConfirmDialog

### 基础用法

```tsx
'use client';

import { useState } from 'react';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import Button from '@/components/admin/Button';

export default function Example() {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = async () => {
    console.log('确认删除');
    // 执行删除操作
  };

  return (
    <div>
      <Button 
        variant="danger"
        onClick={() => setIsOpen(true)}
      >
        删除
      </Button>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        title="确认删除"
        description="此操作无法撤销，确定要删除吗？"
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  );
}
```

### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| isOpen | boolean | - | 是否打开 |
| onClose | function | - | 关闭回调 |
| onConfirm | function \| Promise | - | 确认回调 |
| title | string | '确认操作' | 对话框标题 |
| description | string | - | 对话框描述 |
| confirmText | string | '确认' | 确认按钮文本 |
| cancelText | string | '取消' | 取消按钮文本 |
| variant | 'danger' \| 'warning' \| 'info' \| 'success' | 'danger' | 变体类型 |
| isLoading | boolean | false | 是否加载中 |

---

## Toast

### 基础用法

```tsx
'use client';

import { useToast, ToastContainer } from '@/components/admin/Toast';
import Button from '@/components/admin/Button';

export default function Example() {
  const { success, error, warning, info } = useToast();

  return (
    <div>
      <Button onClick={() => success('操作成功！')}>
        显示成功提示
      </Button>
      <Button onClick={() => error('操作失败！')} variant="danger">
        显示错误提示
      </Button>
      <Button onClick={() => warning('警告信息')} variant="warning">
        显示警告提示
      </Button>
      <Button onClick={() => info('提示信息')} variant="secondary">
        显示信息提示
      </Button>

      <ToastContainer 
        toasts={[]} 
        position="top-right" 
      />
    </div>
  );
}
```

### useToast Hook

| 方法 | 参数 | 描述 |
|------|------|------|
| success | message, options | 显示成功提示 |
| error | message, options | 显示错误提示 |
| warning | message, options | 显示警告提示 |
| info | message, options | 显示信息提示 |

### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| toasts | ToastProps[] | - | Toast数组 |
| onClose | function | - | 关闭回调 |
| position | 'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left' | 'top-right' | 位置 |

---

## FormInput

### 基础用法

```tsx
'use client';

import { useState } from 'react';
import FormInput from '@/components/admin/FormInput';
import { Mail, Lock, Search } from 'lucide-react';

export default function Example() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-4 max-w-md">
      <FormInput
        label="邮箱"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={Mail}
        placeholder="请输入邮箱"
        variant="default"
        size="md"
        showPasswordToggle={false}
      />

      <FormInput
        label="密码"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={Lock}
        placeholder="请输入密码"
        variant="default"
        size="md"
        showPasswordToggle
      />

      <FormInput
        label="搜索"
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftIcon={Search}
        rightIcon={Search}
        placeholder="搜索内容..."
        variant="outlined"
        size="lg"
        onClear={() => setSearch('')}
      />
    </div>
  );
}
```

### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| label | string | - | 标签文本 |
| type | string | 'text' | 输入类型 |
| value | string \| number | - | 输入值 |
| onChange | function | - | 变化回调 |
| error | string | - | 错误信息 |
| success | string | - | 成功信息 |
| leftIcon | ComponentType | - | 左侧图标 |
| rightIcon | ComponentType | - | 右侧图标 |
| onRightIconClick | function | - | 右侧图标点击 |
| onClear | function | - | 清除回调 |
| variant | 'default' \| 'filled' \| 'outlined' | 'default' | 变体类型 |
| size | 'sm' \| 'md' \| 'lg' | 'md' | 尺寸 |
| loading | boolean | false | 是否加载中 |
| showPasswordToggle | boolean | false | 是否显示密码切换 |

---

## Button

### 基础用法

```tsx
'use client';

import Button from '@/components/admin/Button';
import { Download, Plus, Share2 } from 'lucide-react';

export default function Example() {
  return (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary" size="md">
        主要按钮
      </Button>

      <Button variant="secondary" size="md">
        次要按钮
      </Button>

      <Button variant="outline" size="md">
        边框按钮
      </Button>

      <Button variant="danger" size="md">
        危险按钮
      </Button>

      <Button 
        variant="success" 
        size="md"
        leftIcon={Plus}
      >
        新建
      </Button>

      <Button 
        variant="warning" 
        size="md"
        rightIcon={Download}
      >
        下载
      </Button>

      <Button 
        variant="primary" 
        size="lg"
        leftIcon={Share2}
        glowEffect
      >
        分享
      </Button>

      <Button 
        variant="primary" 
        size="md" 
        loading
      >
        加载中
      </Button>

      <Button 
        variant="success" 
        size="md" 
        success
      >
        完成
      </Button>
    </div>
  );
}
```

### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| variant | 'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger' \| 'success' \| 'warning' | 'primary' | 变体类型 |
| size | 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' | 'md' | 尺寸 |
| loading | boolean | false | 是否加载中 |
| success | boolean | false | 是否成功状态 |
| leftIcon | ComponentType | - | 左侧图标 |
| rightIcon | ComponentType | - | 右侧图标 |
| fullWidth | boolean | false | 是否全宽 |
| glowEffect | boolean | true | 是否发光效果 |
| ripple | boolean | true | 是否波纹效果 |
| onClick | function | - | 点击回调 |

---

## DataTable

### 基础用法

```tsx
'use client';

import { useState } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import { Edit, Trash2, Eye } from 'lucide-react';

interface Article {
  id: number;
  title: string;
  author: string;
  status: string;
  views: number;
  createdAt: string;
}

export default function Example() {
  const [articles] = useState<Article[]>([
    { id: 1, title: '文章标题1', author: '张三', status: '已发布', views: 1234, createdAt: '2024-01-01' },
    { id: 2, title: '文章标题2', author: '李四', status: '草稿', views: 567, createdAt: '2024-01-02' },
    { id: 3, title: '文章标题3', author: '王五', status: '已发布', views: 890, createdAt: '2024-01-03' },
  ]);

  const columns: Column<Article>[] = [
    { 
      key: 'title', 
      title: '标题', 
      sortable: true,
      filterable: true,
    },
    { 
      key: 'author', 
      title: '作者',
      sortable: true,
    },
    { 
      key: 'status', 
      title: '状态',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === '已发布' 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
        }`}>
          {value}
        </span>
      ),
    },
    { 
      key: 'views', 
      title: '浏览量',
      sortable: true,
    },
    { 
      key: 'createdAt', 
      title: '创建时间',
      sortable: true,
    },
    {
      key: 'actions',
      title: '操作',
      render: (_, row) => (
        <div className="flex gap-2">
          <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded">
            <Edit className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleRowClick = (row: Article) => {
    console.log('点击行:', row);
  };

  return (
    <DataTable
      data={articles}
      columns={columns}
      keyField="id"
      pageSize={10}
      pagination
      selectable
      onRowClick={handleRowClick}
    />
  );
}
```

### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| data | T[] | - | 数据数组 |
| columns | Column\<T\>[] | - | 列配置 |
| keyField | string | 'id' | 键字段 |
| loading | boolean | false | 是否加载中 |
| empty | object | - | 空状态配置 |
| pageSize | number | 10 | 每页条数 |
| pagination | boolean | true | 是否分页 |
| selectable | boolean | false | 是否可选 |
| onSelectionChange | function | - | 选择变化回调 |
| onRowClick | function | - | 行点击回调 |
| rowClassName | string | - | 行类名 |

---

## 完整示例

### 文章管理页面

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GlassCardAdmin from '@/components/ui/AdminGlassCard';
import StatCard from '@/components/ui/StatCard';
import DataTable, { Column } from '@/components/admin/DataTable';
import Button from '@/components/admin/Button';
import { useToast, LoadingState, EmptyState, ConfirmDialog } from '@/components/admin';
import { FileText, Users, Eye, TrendingUp, Edit, Trash2, Plus } from 'lucide-react';

interface Article {
  id: number;
  title: string;
  author: string;
  status: 'published' | 'draft' | 'archived';
  views: number;
  createdAt: string;
}

export default function ArticlesPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: number }>({ open: false });

  const stats = [
    { label: '文章总数', value: articles.length, icon: FileText, color: '#3b82f6' },
    { label: '已发布', value: articles.filter(a => a.status === 'published').length, icon: TrendingUp, color: '#10b981' },
    { label: '草稿', value: articles.filter(a => a.status === 'draft').length, icon: Users, color: '#f59e0b' },
    { label: '总浏览', value: articles.reduce((sum, a) => sum + a.views, 0).toLocaleString(), icon: Eye, color: '#8b5cf6' },
  ];

  const columns: Column<Article>[] = [
    {
      key: 'title',
      title: '标题',
      sortable: true,
      filterable: true,
    },
    {
      key: 'author',
      title: '作者',
      sortable: true,
    },
    {
      key: 'status',
      title: '状态',
      render: (value) => {
        const statusMap = {
          published: { label: '已发布', className: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
          draft: { label: '草稿', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' },
          archived: { label: '已归档', className: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400' },
        };
        const config = statusMap[value as keyof typeof statusMap];
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'views',
      title: '浏览量',
      sortable: true,
    },
    {
      key: 'createdAt',
      title: '创建时间',
      sortable: true,
    },
    {
      key: 'actions',
      title: '操作',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => router.push(`/admin/articles/${row.id}`)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setDeleteDialog({ open: true, id: row.id })}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      setArticles([
        { id: 1, title: '如何使用 Next.js 14', author: '张三', status: 'published', views: 1234, createdAt: '2024-01-01' },
        { id: 2, title: 'React 18 新特性解析', author: '李四', status: 'draft', views: 567, createdAt: '2024-01-02' },
        { id: 3, title: 'TypeScript 最佳实践', author: '王五', status: 'published', views: 890, createdAt: '2024-01-03' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    
    try {
      // 模拟删除操作
      await new Promise(resolve => setTimeout(resolve, 500));
      setArticles(articles.filter(a => a.id !== deleteDialog.id));
      setDeleteDialog({ open: false });
      success('删除成功！');
    } catch {
      error('删除失败，请重试');
    }
  };

  const handleBatchDelete = async () => {
    try {
      // 模拟批量删除
      await new Promise(resolve => setTimeout(resolve, 500));
      setArticles(articles.filter(a => !selectedIds.includes(a.id)));
      setSelectedIds([]);
      success(`已删除 ${selectedIds.length} 篇文章`);
    } catch {
      error('批量删除失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="加载文章数据..." size="lg" variant="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            {...stat}
            href="/admin/articles"
            animationDelay={index * 100}
          />
        ))}
      </div>

      {/* 文章列表 */}
      <GlassCardAdmin className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">文章列表</h2>
          <div className="flex gap-3">
            {selectedIds.length > 0 && (
              <Button variant="danger" size="sm" onClick={handleBatchDelete}>
                删除选中 ({selectedIds.length})
              </Button>
            )}
            <Button variant="primary" size="sm" leftIcon={Plus} onClick={() => router.push('/admin/articles/new')}>
              新建文章
            </Button>
          </div>
        </div>

        {articles.length === 0 ? (
          <EmptyState
            title="暂无文章"
            description="创建您的第一篇文章开始写作"
            icon={FileText}
            variant="create"
            action={{
              label: '创建文章',
              onClick: () => router.push('/admin/articles/new'),
              icon: Plus,
            }}
          />
        ) : (
          <DataTable
            data={articles}
            columns={columns}
            keyField="id"
            pageSize={10}
            selectable
            onSelectionChange={(selected) => setSelectedIds(selected.map(a => a.id))}
          />
        )}
      </GlassCardAdmin>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false })}
        onConfirm={handleDelete}
        title="确认删除"
        description="此操作无法撤销，确定要删除这篇文章吗？"
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  );
}
```

---

## 设计原则

### Glassmorphism 效果

所有卡片组件都采用毛玻璃效果：

```tsx
className="bg-white/50 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50"
```

### 动画效果

使用 Framer Motion 实现流畅动画：

- **入场动画**: `initial={{ opacity: 0, y: 20 }}` `animate={{ opacity: 1, y: 0 }}`
- **悬停效果**: `whileHover={{ scale: 1.02 }}`
- **点击效果**: `whileTap={{ scale: 0.98 }}`
- **延迟动画**: `transition={{ delay: index * 0.1 }}`

### 响应式设计

使用 Tailwind 的响应式断点：

```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
```

### 深色模式支持

所有组件都支持深色模式：

```tsx
className="bg-white/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-100"
```

---

## 性能优化建议

1. **使用 React.memo**: 对不常变化的组件使用 `React.memo`
2. **使用 useCallback**: 对事件处理函数使用 `useCallback`
3. **使用 useMemo**: 对计算密集型操作使用 `useMemo`
4. **懒加载**: 使用 `React.lazy` 和 `Suspense` 懒加载组件
5. **虚拟滚动**: 对大量数据使用虚拟滚动

---

## 浏览器兼容性

- Chrome/Edge: ✅ 完全支持
- Firefox: ✅ 完全支持
- Safari: ✅ 完全支持 (需要 Safari 14+)
- IE 11: ❌ 不支持

---

## 未来计划

- [ ] 添加更多主题色
- [ ] 支持自定义主题
- [ ] 添加更多动画效果
- [ ] 支持更多表单组件（Select、DatePicker、Upload等）
- [ ] 添加图表组件
- [ ] 添加拖拽排序功能
- [ ] 支持虚拟滚动
- [ ] 添加国际化支持
- [ ] 添加无障碍功能增强
- [ ] 性能优化和 Bundle 优化
