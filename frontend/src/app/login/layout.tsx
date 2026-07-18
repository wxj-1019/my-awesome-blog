import '../../styles/globals.css';
import type { Metadata } from 'next';
import ThemeWrapper from '@/components/theme-wrapper';
import AuthCookieSync from '@/components/auth/AuthCookieSync';

export const metadata: Metadata = {
  title: '登录 - 我的优秀博客',
  description: '登录以访问您的个人资料',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeWrapper>
      <AuthCookieSync />
      <main className="min-h-screen">{children}</main>
    </ThemeWrapper>
  );
}
