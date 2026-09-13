'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { unsubscribe } from '@/lib/api/subscriptions';

/** 简单邮箱格式校验（与 Footer 订阅表单一致） */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 取消订阅页（极简居中卡片）：
 * 邮箱输入 + 确认按钮，调用 `POST /subscriptions/unsubscribe?email=xxx`。
 * 支持从退订邮件链接 `?email=xxx` 预填邮箱。
 */
export default function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');

  const handleUnsubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setResult('error');
      setMessage('请输入有效的邮箱地址');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      await unsubscribe(trimmed);
      setResult('success');
      setMessage('取消订阅成功，不会再收到本站更新通知。');
    } catch (err) {
      setResult('error');
      setMessage(err instanceof Error ? err.message : '退订失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-glass/30 backdrop-blur-xl border border-glass-border rounded-macos-lg p-8 text-center">
        {result === 'success' ? (
          <>
            <CheckCircle2
              className="mx-auto h-10 w-10 text-success"
              aria-hidden
            />
            <h1 className="mt-4 text-lg font-semibold text-foreground">
              取消订阅成功
            </h1>
            <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
              {message}
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex h-9 items-center justify-center rounded-lg border border-border/60 bg-muted/40 px-4 text-sm text-muted-foreground transition-colors hover:text-primary hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              返回首页
            </Link>
          </>
        ) : (
          <>
            {result === 'error' && (
              <XCircle className="mx-auto h-10 w-10 text-error" aria-hidden />
            )}
            <h1 className="mt-2 text-lg font-semibold text-foreground">
              取消订阅
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              输入订阅邮箱，确认后不再接收本站更新通知。
            </p>
            <form
              onSubmit={handleUnsubscribe}
              className="mt-6 flex flex-col gap-3"
              noValidate
            >
              <div>
                <label
                  htmlFor="unsubscribe-email"
                  className="block text-left text-xs text-muted-foreground mb-1.5"
                >
                  邮箱地址
                </label>
                <input
                  id="unsubscribe-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-describedby="unsubscribe-status"
                  disabled={submitting}
                  className="h-9 w-full rounded-lg bg-muted/40 border border-border/60 px-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/40 disabled:opacity-60"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border/60 bg-muted/40 px-4 text-sm text-muted-foreground transition-colors hover:text-primary hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2
                      className="mr-2 h-3.5 w-3.5 animate-spin"
                      aria-hidden
                    />
                    正在提交…
                  </>
                ) : (
                  '确认退订'
                )}
              </button>
            </form>
            <p
              id="unsubscribe-status"
              role="status"
              aria-live="polite"
              className={`mt-4 min-h-4 text-xs ${
                result === 'error' ? 'text-error' : ''
              }`}
            >
              {message}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
