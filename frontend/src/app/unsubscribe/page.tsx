import type { Metadata } from 'next';
import { Suspense } from 'react';
import UnsubscribeContent from './unsubscribe-content';

export const metadata: Metadata = {
  title: '取消订阅 - My Awesome Blog',
  description: '输入邮箱取消订阅本站更新通知。',
};

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
          加载中...
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
