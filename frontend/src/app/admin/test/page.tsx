'use client';

import * as React from 'react';
import GlassCardAdmin from '@/components/ui/GlassCardAdmin';
import StatCard from '@/components/ui/StatCard';
import LoadingState from '@/components/admin/LoadingState';
import EmptyState from '@/components/admin/EmptyState';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { ToastContainer, useToast } from '@/components/admin/Toast';
import FormInput from '@/components/admin/FormInput';
import Button from '@/components/admin/Button';
import DataTable, { Column } from '@/components/admin/DataTable';
import { 
  FileText, 
  Users, 
  Eye, 
  TrendingUp, 
  Plus, 
  Download, 
  Share2,
  Mail,
  Lock,
  Search,
  Edit,
  Trash2
} from 'lucide-react';

interface TestArticle {
  id: number;
  title: string;
  author: string;
  status: 'published' | 'draft' | 'archived';
  views: number;
  createdAt: string;
}

export default function AdminTestPage() {
  const { success, error, warning, info, toasts, removeToast } = useToast();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [search, setSearch] = React.useState('');

  const stats = [
    { label: '文章总数', value: 156, icon: FileText, color: '#3b82f6', trend: { value: 12.5, isPositive: true } },
    { label: '用户数', value: 2847, icon: Users, color: '#10b981', trend: { value: 8.2, isPositive: true } },
    { label: '总浏览', value: '125.6K', icon: Eye, color: '#8b5cf6', trend: { value: 23.1, isPositive: true } },
    { label: '增长率', value: '+32%', icon: TrendingUp, color: '#f59e0b', trend: { value: 5.3, isPositive: false } },
  ];

  const articles: TestArticle[] = [
    { id: 1, title: '如何使用 Next.js 14', author: '张三', status: 'published', views: 1234, createdAt: '2024-01-01' },
    { id: 2, title: 'React 18 新特性解析', author: '李四', status: 'draft', views: 567, createdAt: '2024-01-02' },
    { id: 3, title: 'TypeScript 最佳实践', author: '王五', status: 'published', views: 890, createdAt: '2024-01-03' },
    { id: 4, title: 'Tailwind CSS 技巧', author: '赵六', status: 'archived', views: 432, createdAt: '2024-01-04' },
    { id: 5, title: 'Framer Motion 动画指南', author: '孙七', status: 'published', views: 765, createdAt: '2024-01-05' },
  ];

  const columns: Column<TestArticle>[] = [
    { key: 'title', title: '标题', sortable: true, filterable: true },
    { key: 'author', title: '作者', sortable: true },
    {
      key: 'status',
      title: '状态',
      render: (value) => {
        const statusMap = {
          published: { label: '已发布', className: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
          draft: { label: '草稿', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' },
          archived: { label: '已归档', className: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400' },
        };
        const config = statusMap[value as keyof typeof statusMap];
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
            {config.label}
          </span>
        );
      },
    },
    { key: 'views', title: '浏览量', sortable: true },
    { key: 'createdAt', title: '创建时间', sortable: true },
    {
      key: 'actions',
      title: '操作',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="xs">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="xs">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-tech-cyan to-tech-sky bg-clip-text text-transparent mb-4">
            后台管理系统 UI 组件测试
          </h1>
          <p className="text-foreground/60">
            展示所有优化后的组件及其交互效果
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">统计卡片 (StatCard)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <StatCard
                key={stat.label}
                {...stat}
                sparkline={[10, 20, 15, 30, 25, 40, 35, 50]}
                animationDelay={index * 100}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Glass Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCardAdmin className="p-6">
              <h3 className="text-lg font-semibold mb-2">Primary Card</h3>
              <p className="text-foreground/70">主要样式的毛玻璃卡片</p>
            </GlassCardAdmin>
            <GlassCardAdmin variant="accent" className="p-6">
              <h3 className="text-lg font-semibold mb-2">Accent Card</h3>
              <p className="text-foreground/70">强调样式的毛玻璃卡片</p>
            </GlassCardAdmin>
            <GlassCardAdmin className="p-6">
              <h3 className="text-lg font-semibold mb-2">Success Card</h3>
              <p className="text-foreground/70">成功样式的毛玻璃卡片</p>
            </GlassCardAdmin>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">按钮组件 (Button)</h2>
          <GlassCardAdmin className="p-6">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="md">Primary</Button>
                <Button variant="secondary" size="md">Secondary</Button>
                <Button variant="outline" size="md">Outline</Button>
                <Button variant="ghost" size="md">Ghost</Button>
                <Button variant="danger" size="md">Danger</Button>
                <Button variant="success" size="md">Success</Button>
                <Button variant="warning" size="md">Warning</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="xs">Extra Small</Button>
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
                <Button variant="primary" size="xl">Extra Large</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" leftIcon={Plus}>新建</Button>
                <Button variant="secondary" rightIcon={Download}>下载</Button>
                <Button variant="success" leftIcon={Share2}>分享</Button>
                <Button variant="primary" loading>Loading</Button>
                <Button variant="success" success>Success</Button>
              </div>
            </div>
          </GlassCardAdmin>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">表单输入 (FormInput)</h2>
          <GlassCardAdmin className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <FormInput
                label="邮箱"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={Mail}
                placeholder="请输入邮箱"
                variant="default"
              />
              <FormInput
                label="密码"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={Lock}
                placeholder="请输入密码"
                showPasswordToggle
              />
              <FormInput
                label="搜索"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={Search}
                placeholder="搜索内容..."
                variant="outlined"
                onClear={() => setSearch('')}
              />
              <FormInput
                label="带验证"
                type="text"
                defaultValue="test@example.com"
                success="邮箱格式正确"
                leftIcon={Mail}
              />
            </div>
          </GlassCardAdmin>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Toast 通知</h2>
          <GlassCardAdmin className="p-6">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => success('操作成功！数据已保存。')}>
                Success Toast
              </Button>
              <Button variant="danger" onClick={() => error('操作失败！请重试。')}>
                Error Toast
              </Button>
              <Button variant="warning" onClick={() => warning('警告：请注意数据安全。')}>
                Warning Toast
              </Button>
              <Button variant="secondary" onClick={() => info('提示：系统将在5分钟后维护。')}>
                Info Toast
              </Button>
            </div>
          </GlassCardAdmin>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">确认对话框</h2>
          <GlassCardAdmin className="p-6">
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              打开确认对话框
            </Button>
            <ConfirmDialog
              isOpen={confirmOpen}
              onClose={() => setConfirmOpen(false)}
              onConfirm={async () => {
                await new Promise(resolve => setTimeout(resolve, 1000));
                success('删除成功！');
              }}
              title="确认删除"
              description="此操作无法撤销，确定要删除这个项目吗？"
              confirmText="删除"
              cancelText="取消"
              variant="danger"
            />
          </GlassCardAdmin>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">加载状态</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCardAdmin className="p-6">
              <h3 className="text-lg font-semibold mb-4">Spinner</h3>
              <LoadingState variant="spinner" message="加载中..." />
            </GlassCardAdmin>
            <GlassCardAdmin className="p-6">
              <h3 className="text-lg font-semibold mb-4">Dots</h3>
              <LoadingState variant="dots" message="请稍候..." />
            </GlassCardAdmin>
            <GlassCardAdmin className="p-6">
              <h3 className="text-lg font-semibold mb-4">Pulse</h3>
              <LoadingState variant="pulse" message="处理中..." />
            </GlassCardAdmin>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">空状态</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCardAdmin className="p-6">
              <h3 className="text-lg font-semibold mb-4">Create Variant</h3>
              <EmptyState
                title="暂无文章"
                description="创建您的第一篇文章开始写作"
                icon={FileText}
                variant="create"
                action={{
                  label: '创建文章',
                  onClick: () => success('开始创建文章'),
                  icon: Plus,
                }}
              />
            </GlassCardAdmin>
            <GlassCardAdmin className="p-6">
              <h3 className="text-lg font-semibold mb-4">Search Variant</h3>
              <EmptyState
                title="未找到结果"
                description="请尝试其他搜索关键词"
                icon={Search}
                variant="search"
              />
            </GlassCardAdmin>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">数据表格 (DataTable)</h2>
          <GlassCardAdmin className="p-6">
            <DataTable
              data={articles}
              columns={columns}
              keyField="id"
              pageSize={5}
              pagination
              selectable
              onSelectionChange={(selected) => console.log('Selected:', selected)}
              onRowClick={(row) => console.log('Clicked:', row)}
            />
          </GlassCardAdmin>
        </section>

      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} position="top-right" />
    </div>
  );
}
