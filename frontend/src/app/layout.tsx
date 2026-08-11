import '../styles/globals.css';
import type { Metadata } from 'next';
import {
  Inter,
  Syne,
  Manrope,
  Cinzel,
  Fraunces,
  DM_Serif_Display as DmSerifDisplay,
  Abril_Fatface as AbrilFatface,
  Noto_Serif_SC as NotoSerifSC,
  Ma_Shan_Zheng as MaShanZheng,
  UnifrakturMaguntia,
  Zen_Maru_Gothic as ZenMaruGothic,
} from 'next/font/google';
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

// 分页面艺术字体（仅 kicker/装饰用；单字重 400，next/font 自动子集化）
const cinzel = Cinzel({ subsets: ['latin'], weight: '400', variable: '--font-cinzel' });
const fraunces = Fraunces({ subsets: ['latin'], weight: '400', variable: '--font-fraunces' });
const dmSerif = DmSerifDisplay({ subsets: ['latin'], weight: '400', variable: '--font-dm-serif' });
const abril = AbrilFatface({ subsets: ['latin'], weight: '400', variable: '--font-abril' });

// 中文标题/正文衬线字体（思源宋体）：标题用 700，正文用 400，控制体积
// next/font 对 CJK 仅 subsets:['latin'] 生效，中文字形由浏览器按需加载 woff2 分片
const notoSerifSC = NotoSerifSC({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-serif-sc',
});

// 马善政楷书：首页打字机标题（毛笔书法氛围，单字重 400）
const maShanZheng = MaShanZheng({
  weight: '400',
  variable: '--font-ma-shan-zheng',
});

// 哥特黑体：塔罗牌英文牌名（中世纪魔法书氛围，单字重 400）
const unifraktur = UnifrakturMaguntia({
  weight: '400',
  variable: '--font-unifraktur',
});

// Zen Maru Gothic：顶部导航栏（日系圆体，圆润现代；400/500/700 控制体积）
const zenMaruGothic = ZenMaruGothic({
  weight: ['400', '500', '700'],
  variable: '--font-zen-maru-gothic',
});

export const metadata: Metadata = {
  title: '我的优秀博客',
  description: '一个现代的企业级个人博客',
  generator: 'Next.js',
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
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
        {/* overflow-x-hidden 防止 AmbientBackground 溢出产生横向滚动条；不设 overflow-y 以保证 sticky 生效 */}
        <div className="flex flex-col min-h-screen overflow-x-hidden">
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
            // 必须与 @/lib/theme-config THEME_STORAGE_KEY (= 'theme') 一致
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'auto';
                  var isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  var mode = isDark ? 'dark' : 'light';
                  var root = document.documentElement;
                  root.classList.remove('light', 'dark');
                  root.classList.add(mode);
                  root.setAttribute('data-theme', mode);
                  root.setAttribute('data-mode', mode);
                } catch (e) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-mode', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${syne.variable} ${manrope.variable} ${cinzel.variable} ${fraunces.variable} ${dmSerif.variable} ${abril.variable} ${notoSerifSC.variable} ${maShanZheng.variable} ${unifraktur.variable} ${zenMaruGothic.variable} font-sans bg-background`}>
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
