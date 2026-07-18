# 前端框架规则

> 适用于 `frontend/src/` 下所有代码。修改前端代码前必须阅读本文件。

## 1. 技术栈与版本

- **框架**: Next.js 16.1.6（App Router）
- **语言**: TypeScript 5.x（strict 模式已开启）
- **样式**: Tailwind CSS 3.x
- **UI 基座**: Radix UI + 自定义 `components/ui`
- **动画**: Framer Motion、GSAP、Lottie
- **状态**: React Context（不使用 Redux/Zustand）
- **字体**: Inter、Syne、Manrope（在 `layout.tsx` 中配置）

## 2. 目录结构与职责

```
frontend/src/
├── app/                    # Next.js App Router 页面
│   ├── page.tsx            # 首页
│   ├── layout.tsx          # 根布局
│   ├── admin/              # 管理后台页面
│   ├── ai/                 # AI 相关页面
│   ├── articles/           # 文章相关
│   ├── messages/           # 留言板
│   ├── music/              # 音乐大厅
│   ├── videos/             # 视频
│   └── albums/             # 相册
├── components/
│   ├── ui/                 # 通用 UI 组件（Button、Card、Dialog 等）
│   ├── home/               # 首页专属组件
│   ├── navigation/         # 导航相关
│   ├── admin/              # 后台组件
│   ├── messages/           # 留言板组件
│   ├── music/              # 音乐组件
│   ├── videos/             # 视频组件
│   ├── articles/           # 文章组件
│   ├── chat/               # AI 聊天组件
│   ├── error/              # 错误边界
│   └── layout/             # 布局组件
├── lib/                    # 工具函数与通用客户端
│   ├── utils.ts            # cn() 等
│   ├── env.ts              # 环境变量封装
│   ├── api-client.ts       # 统一 API 请求客户端（axios 封装）
│   └── api/                # 按领域封装的 API 调用
├── hooks/                  # 自定义 Hooks
├── services/               # 业务服务层
├── types/                  # TypeScript 类型定义
├── context/                # React Context
├── styles/
│   ├── globals.css         # 全局样式 + CSS 变量
│   ├── animations/         # 关键帧动画
│   ├── components/         # 组件级样式
│   └── utilities/          # 工具类样式
├── mock/                   # Mock 数据
└── constants/              # 常量
```

## 3. 页面规则

### 3.1 App Router 约定
- 每个页面目录下使用 `page.tsx` 作为页面组件。
- 共享布局使用 `layout.tsx`。
- 动态路由使用 `[id]/page.tsx`。
- 页面组件**默认是 Server Component**，只有在需要客户端交互时才加 `'use client'`。

### 3.2 Server Component 优先
- 数据获取、SEO 元数据、静态渲染尽量在 Server Component 中完成。
- 仅在以下情况使用 Client Component（`'use client'`）：
  - 使用 `useState`、`useEffect`、`useContext`
  - 使用浏览器 API（localStorage、window、document）
  - 需要事件监听（onClick、onSubmit 等）
  - 使用第三方客户端库（Framer Motion、GSAP、Lottie）

### 3.3 元数据
- 在 `layout.tsx` 或 `page.tsx` 中导出 `metadata` 对象；动态路由使用 `generateMetadata`。
- 站点基础 URL 使用 `env.NEXT_PUBLIC_SITE_URL`。
- **Client Component 页面**：如果整页需要 `'use client'`，应将交互内容拆分到 `*-content.tsx`（Client Component），`page.tsx` 保持为 Server Component 并导出 `metadata`，再导入内容组件。示例：
  ```tsx
  // app/about/page.tsx
  import { Metadata } from 'next';
  import AboutContent from './about-content';

  export const metadata: Metadata = {
    title: '关于我 - My Awesome Blog',
    description: '...',
  };

  export default function AboutPage() {
    return <AboutContent />;
  }
  ```
- 每个公开页面必须有独立的 title 和 description，禁止所有页面共用同一个默认 title。

## 4. 组件规则

### 4.1 文件命名
- 组件文件：**PascalCase.tsx**（如 `GlassCard.tsx`）
- Hooks：**use*.ts**（如 `useTheme.ts`）
- 工具函数：**camelCase.ts**（如 `utils.ts`）
- 页面文件：`page.tsx`、`layout.tsx`、`loading.tsx`、`error.tsx`

### 4.2 组件写法
- 使用函数组件，默认导出。
- 必须定义 props 接口，优先使用 `interface` 而非 `type`。
- 使用 `React.ReactNode` 表示 children。
- 需要 ref 转发时使用 `React.forwardRef`。
- 示例：

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glass';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border',
          variant === 'glass' && 'bg-glass/30 backdrop-blur-xl',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
export default Card;
```

### 4.3 导入顺序
```typescript
// 1. React / Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. 外部库
import { motion } from 'framer-motion';

// 3. 内部 UI 组件
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';

// 4. 内部 Hooks / Services / 工具
import { useTheme } from '@/context/theme-context';
import { articleService } from '@/services/articleService';
import { cn } from '@/lib/utils';
```

### 4.4 路径别名
- 必须使用 `@/*` 别名，禁止相对路径 `../../../`。
- 常用别名：
  - `@/components/*`
  - `@/lib/*`
  - `@/services/*`
  - `@/hooks/*`
  - `@/types/*`
  - `@/context/*`

## 5. 样式规则

### 5.1 Tailwind 与全局样式
- 全部使用 Tailwind utility classes，禁止手写 CSS（除非全局主题变量）。
- 使用 `cn()` 组合条件类名。
- 颜色必须使用主题变量：`bg-background`、`text-foreground`、`text-primary`。
- 玻璃拟态基础组合：
  ```
  bg-glass/30 backdrop-blur-xl border border-glass-border
  ```
- `globals.css` 只保留主题变量与基础样式；动画关键帧放 `styles/animations/`，组件特效放 `styles/components/`，工具类放 `styles/utilities/`。

### 5.2 卡片组件
- 文章/帖子卡片统一使用 `components/ui/ArticleCard.tsx`。
- 新增卡片变体时应扩展 `ArticleCard`，而非复制创建新的卡片组件。

### 5.3 响应式
- 移动优先：基础样式 + `sm:`、`md:`、`lg:`、`xl:` 覆盖。
- 断点参考：xs(475)、sm(640)、md(768)、tab(834)、lg(1024)、xl(1280)、2xl(1536)。

### 5.4 动画
- 优先使用 Tailwind 预设动画：`animate-fade-in-up`、`animate-slide-in-left`、`animate-pulse-glow`。
- 复杂动画使用 Framer Motion 或 GSAP。
- 动画元素必须考虑 `prefers-reduced-motion`。

## 6. 状态与数据

### 6.1 全局状态
- 使用 React Context（`context/` 目录）。
- 现有 Context：`LoadingProvider`、`ErrorBoundaryProvider`、`ThemeWrapper`。
- 新增全局状态前评估是否可以用局部状态或 URL 参数替代。

### 6.2 数据获取
- Server Component：直接在组件内 `await` 调用 services。
- Client Component：在 `useEffect` 中调用 services，处理 loading/error 状态。
- 推荐使用 services 层封装，不在组件内直接写 fetch。

### 6.3 API 请求规范
- 统一使用 `lib/api-client.ts` 中封装的 axios 实例发起请求，禁止在组件或服务中直接 `fetch`。
- `lib/api/` 下按领域封装具体 API 调用（如 `articles.ts`、`messages.ts`），返回类型必须精确。
- Services 层（`services/`）组合多个 API 调用或处理业务转换，每个业务领域一个文件：`articleService.ts`、`messageService.ts`。
- API 基础 URL 来自 `NEXT_PUBLIC_API_BASE_URL`。
- 统一处理错误和响应格式。

### 6.4 Mock 数据
- 测试/开发用 Mock 数据统一放在 `src/mock/`。
- 禁止在业务代码中散落硬编码假数据。

## 7. 类型规则

- 所有 props、state、函数参数必须显式类型。
- 禁止 `any`。确实不确定时用 `unknown` 并在使用前断言。
- 公共类型定义在 `src/types/index.ts` 或 `src/types/{domain}.ts`。
- 优先 `interface`，交叉类型用 `interface extends`。
- Article 相关类型已统一收敛到 `src/types/article.ts`，新增/修改文章字段时必须同步更新该文件，禁止在多处重复定义 Article 类型。

## 8. 错误处理

- 使用 `ErrorBoundaryProvider` 包裹关键组件。
- Client Component 中 API 错误使用 `try/catch` + toast 提示。
- 不要吞掉错误，必须记录或展示。

## 9. 性能规则

- 频繁渲染的组件使用 `React.memo`。
- 昂贵计算使用 `useMemo`，事件回调使用 `useCallback`。
- **图片必须使用 Next.js `<Image>`**：优先使用 `next/image`，获得自动优化、WebP/AVIF 转换和防止 CLS。
  - 受控来源（项目上传、OSS、public/ 静态资源）必须迁移到 `<Image>`。
  - 对于用户任意提交的外部域名图片（如友链头像、favicon、用户 Markdown 图片），若无法加入 `next.config.js` 的 `remotePatterns`，可保留 `<img>`，但必须在代码旁添加中文注释说明原因。
  - 使用 `<Image>` 时必须提供 `width`/`height` 或 `fill`（配合 `relative` 父容器），禁止只写 `src` 和 `className`。
- 大列表使用虚拟滚动（react-window）。
- 路由级代码分割使用 `dynamic` import。

## 10. 列表渲染规则

- **禁止使用数组索引作为 `key`**，除非列表是静态不变的骨架屏或装饰性元素。
- 优先使用数据本身的稳定唯一标识：`item.id`、`item.slug`、`item.name`、`item.label` 等。
- 当没有单一唯一字段时，可组合多个稳定字段，例如 `${item.name}-${item.role}`。
- 骨架屏/占位符列表允许使用 `key={i}`，但需加中文注释说明其为占位符。
- 示例：
  ```tsx
  {articles.map((article) => (
    <ArticleCard key={article.id} article={article} />
  ))}
  ```

## 11. 可访问性规则

- 所有页面必须设置 `<html lang="zh-CN">`（已在根布局配置）。
- 每个页面必须包含「跳转到主要内容」跳过链接，主内容区设置 `id="main-content"`。
- 所有 `<img>` / `<Image>` 必须提供有意义的 `alt`；装饰性图片使用 `alt=""`。
- 表单输入必须关联 `label`（显式 `htmlFor` 或隐式包裹），搜索框等无可见 label 的输入必须提供 `aria-label`。
- 图标按钮必须提供 `aria-label`。
- 标题层级必须连续（h1 → h2 → h3），禁止跳级。
- 所有交互元素必须可见焦点（focus-visible）。
- 动画必须尊重 `prefers-reduced-motion`。
- 无障碍问题参考 `accesslint` 技能清单逐项检查。

## 12. 禁止事项

- ❌ 禁止在组件中直接写 `console.log`（生产代码）
- ❌ 禁止使用 `var`
- ❌ 禁止松散相等 `==`
- ❌ 禁止相对路径 `../../../`
- ❌ 禁止硬编码 API URL
- ❌ 禁止在 Server Component 中使用浏览器 API
- ❌ 禁止无意义的 `useEffect` 依赖
- ❌ 禁止在数据列表中使用 `key={index}`（静态/骨架屏除外）
- ❌ 禁止在受控场景下使用裸 `<img>` 而不使用 `next/image`

## 11. 示例文件参考

- 布局：`frontend/src/app/layout.tsx`
- 首页：`frontend/src/app/page.tsx`
- UI 组件：`frontend/src/components/ui/GlassCard.tsx`
- 工具函数：`frontend/src/lib/utils.ts`
- Service：`frontend/src/services/articleService.ts`
