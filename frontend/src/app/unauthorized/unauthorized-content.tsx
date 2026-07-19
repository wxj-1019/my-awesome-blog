'use client';

import Link from 'next/link';
import { Lock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import PageShell from '@/components/layout/PageShell';

export default function UnauthorizedPageContent() {
  return (
    <PageShell contained={false} className="flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <Lock size={40} className="text-destructive" aria-hidden />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">权限不足</h1>
        <p className="mb-8 text-muted-foreground">
          您需要登录才能访问此功能。请登录后重试。
        </p>
        <Button asChild>
          <Link href="/login" className="inline-flex items-center gap-2">
            <LogIn size={18} aria-hidden />
            前往登录
          </Link>
        </Button>
      </div>
    </PageShell>
  );
}
