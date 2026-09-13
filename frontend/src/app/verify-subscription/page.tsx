import type { Metadata } from 'next';
import { Suspense } from 'react';
import VerifySubscriptionContent from './verify-subscription-content';

export const metadata: Metadata = {
  title: '邮箱验证 - My Awesome Blog',
  description: '验证您的邮件订阅，确认接收本站新文章通知。',
};

export default function VerifySubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
          加载中...
        </div>
      }
    >
      <VerifySubscriptionContent />
    </Suspense>
  );
}
