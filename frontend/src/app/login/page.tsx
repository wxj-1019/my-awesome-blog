import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginPageContent from './login-content';

export const metadata: Metadata = {
  title: '登录 - My Awesome Blog',
  description: '登录您的账户以管理个人资料、发表评论和使用更多个性化功能。',
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
          加载中...
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
