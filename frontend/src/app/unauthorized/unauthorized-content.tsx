'use client';

import Link from 'next/link';
import { Lock, LogIn } from 'lucide-react';

export default function UnauthorizedPageContent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
          <Lock size={40} className="text-red-500" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">权限不足</h1>
        <p className="mb-8 text-muted-foreground">
          您需要登录才能访问此功能。请登录后重试。
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium transition-colors hover:bg-primary/90"
        >
          <LogIn size={18} />
          前往登录
        </Link>
      </div>
    </div>
  );
}
