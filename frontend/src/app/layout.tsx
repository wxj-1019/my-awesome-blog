import '../styles/globals.css';
import type { Metadata } from 'next';
import { Inter, Syne, Manrope } from 'next/font/google';
import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/navigation/Footer';
import ThemeWrapper from '@/components/theme-wrapper';
import { LoadingProvider } from '@/context/loading-context';
import LoadingHandler from '@/components/loading/LoadingHandler';
import { Toaster } from '@/components/ui/toaster';

import { ErrorBoundaryProvider } from '@/components/error/ErrorBoundaryProvider';
import AuthCookieSync from '@/components/auth/AuthCookieSync';
import { env } from '@/lib/env';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const syne = Syne({ subsets: ['latin'], variable: '--font-syne' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

export const metadata: Metadata = {
  title: '我的优秀博客',
  description: '一个现代的企业级个人博客',
  generator: 'Next.js',
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  alternates: {
    types: {
      'application/rss+xml': `${env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/feed.xml`,
    },
  },
};

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <LoadingProvider>
      <ThemeWrapper>
        <AuthCookieSync />
        <div className="flex flex-col min-h-screen bg-background overflow-hidden">
          <Navbar />
          <main id="main-content" className="flex-1" tabIndex={-1}>
            <LoadingHandler>{children}</LoadingHandler>
          </main>
          <Footer />
          <Toaster />
        </div>
        {/* <Live2DWidget /> 注释原因：缺少 public/wanko/runtime 模型资源，启用会导致加载失败 */}
      </ThemeWrapper>
    </LoadingProvider>
  );
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'auto';
                  var isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  var root = document.documentElement;
                  root.classList.remove('light', 'dark');
                  root.classList.add(isDark ? 'dark' : 'light');
                  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${syne.variable} ${manrope.variable} font-sans bg-background`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200]
                     focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground
                     focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          跳转到主要内容
        </a>
        <ErrorBoundaryProvider showDetails={process.env.NODE_ENV === 'development'}>
          <ClientLayout>{children}</ClientLayout>
        </ErrorBoundaryProvider>
      </body>
    </html>
  );
}
