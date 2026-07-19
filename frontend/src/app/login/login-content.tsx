'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import PageShell from '@/components/layout/PageShell';
import { useLoading } from '@/context/loading-context';
import { loginApi } from '@/lib/api/auth';
import '@/styles/components/login-form.css';

export default function LoginPageContent() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, showLoading, hideLoading } = useLoading();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请填写所有必填字段');
      return;
    }

    if (username.length < 3) {
      setError('用户名长度至少为3位');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    showLoading();
    try {
      // loginApi 内部 setToken：localStorage + auth_token cookie
      await loginApi(username, password);

      const redirectParam = searchParams.get('redirect');
      const redirectPath = redirectParam ? decodeURIComponent(redirectParam) : '/profile';
      if (redirectPath.startsWith('/') && !redirectPath.startsWith('//')) {
        router.push(redirectPath as '/profile');
      } else {
        router.push('/profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
      console.error('Login error:', err);
    } finally {
      hideLoading();
    }
  };

  if (!mounted) {
    return null;
  }

  const message = searchParams.get('message');

  return (
    <PageShell
      contained={false}
      className="relative flex items-center justify-center"
    >
      <div className="login-page" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background animate-gradient-shift pointer-events-none"
        aria-hidden
      />
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float-1" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float-2" />
      </div>

      <div className="relative z-50 p-4 w-full flex justify-center">
        <GlassCard
          padding="lg"
          className="max-w-md w-full mx-4 animate-card-appear rounded-2xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">欢迎回来</h1>
            <p className="text-muted-foreground">登录以访问您的个人资料</p>
            {message ? (
              <p className="text-warning mt-2 text-sm">{message}</p>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="bg-transparent text-foreground"
                autoComplete="username"
              />
              <label
                htmlFor="username"
                className="absolute pointer-events-none text-muted-foreground"
              >
                {/* 静态字符：顺序固定，使用 index 作为 key */}
                {Array.from('用户名').map((char, index) => (
                  <span key={index} style={{ transitionDelay: `${index * 50}ms` }}>
                    {char}
                  </span>
                ))}
              </label>
              <User
                className="absolute right-4 top-1/2 -translate-y-1/2 text-primary"
                aria-hidden
              />
            </div>

            <div className="form-control">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-transparent text-foreground"
                autoComplete="current-password"
              />
              <label
                htmlFor="password"
                className="absolute pointer-events-none text-muted-foreground"
              >
                {/* 静态字符：顺序固定，使用 index 作为 key */}
                {Array.from('密码').map((char, index) => (
                  <span key={index} style={{ transitionDelay: `${index * 50}ms` }}>
                    {char}
                  </span>
                ))}
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:text-foreground transition-colors disabled:opacity-50"
                disabled={isLoading}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {error ? (
              <div
                className="bg-destructive/10 border border-destructive/40 rounded-lg p-3 text-destructive text-sm animate-shake"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              variant="default"
              className="w-full font-semibold py-3"
              disabled={isLoading}
            >
              <span className="flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" aria-hidden />
                <span>登录</span>
              </span>
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              还没有账号？
              <Link
                href="/contact"
                className="ml-2 text-primary hover:underline font-medium"
              >
                联系我们
              </Link>
            </p>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
