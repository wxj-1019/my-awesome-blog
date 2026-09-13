'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { verifySubscription } from '@/lib/api/subscriptions';

/** 验证页状态机：请求中 / 成功 / 失败 / 链接缺少 token */
type VerifyState = 'loading' | 'success' | 'error' | 'missing';

const STATE_META: Record<
  Exclude<VerifyState, 'loading'>,
  { title: string; description: string }
> = {
  success: {
    title: '验证成功',
    description: '您的邮箱已确认，之后会收到本站新文章通知。',
  },
  error: {
    title: '验证失败',
    description: '验证链接可能已失效，请重新订阅获取新邮件。',
  },
  missing: {
    title: '链接无效',
    description: '验证链接中缺少 token，请从订阅邮件重新进入。',
  },
};

/**
 * 邮箱订阅验证页（极简居中卡片）：
 * 从邮件链接 `?token=xxx` 读取 token，调用后端 verify 接口完成订阅确认。
 */
export default function VerifySubscriptionContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<VerifyState>(token ? 'loading' : 'missing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      return;
    }
    // 防止 StrictMode 双调用 / 卸载后 setState
    let cancelled = false;
    setState('loading');
    verifySubscription(token)
      .then(() => {
        if (!cancelled) {
          setState('success');
        }
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        setState('error');
        setErrorMessage(err instanceof Error ? err.message : '');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const meta = state === 'loading' ? null : STATE_META[state];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-glass/30 backdrop-blur-xl border border-glass-border rounded-macos-lg p-8 text-center">
        {state === 'loading' ? (
          <>
            <Loader2
              className="mx-auto h-10 w-10 text-primary animate-spin"
              aria-hidden
            />
            <h1 className="mt-4 text-lg font-semibold text-foreground">
              正在验证邮箱…
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              请稍候，正在确认您的订阅。
            </p>
          </>
        ) : (
          <>
            {state === 'success' ? (
              <CheckCircle2
                className="mx-auto h-10 w-10 text-success"
                aria-hidden
              />
            ) : (
              <XCircle className="mx-auto h-10 w-10 text-error" aria-hidden />
            )}
            <h1 className="mt-4 text-lg font-semibold text-foreground">
              {meta?.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
              {state === 'error' && errorMessage
                ? errorMessage
                : meta?.description}
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex h-9 items-center justify-center rounded-lg border border-border/60 bg-muted/40 px-4 text-sm text-muted-foreground transition-colors hover:text-primary hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              返回首页
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
