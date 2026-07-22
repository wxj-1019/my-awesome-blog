'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/navigation/Footer';
import ThemeWrapper from '@/components/theme-wrapper';
import { LoadingProvider } from '@/context/loading-context';
import LoadingHandler from '@/components/loading/LoadingHandler';

// 特殊布局，用于需要全屏媒体组件的页面
const SpecialLayoutComponent = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  
  // 检查是否是需要特殊布局的路径
  const needsSpecialLayout = pathname.startsWith('/articles');
  
  if (needsSpecialLayout) {
    return (
      <LoadingProvider>
        <ThemeWrapper>
          {/* 媒体组件将在子组件中处理 */}
          <Navbar />
          {/* 透明 main：透出 AmbientBackground 水光 */}
          <main className="bg-transparent">
            <LoadingHandler>{children}</LoadingHandler>
          </main>
          <Footer />
        </ThemeWrapper>
      </LoadingProvider>
    );
  }
  
  // 默认布局
  return (
    <LoadingProvider>
      <ThemeWrapper>
        <Navbar />
        <main className="bg-transparent">
          <LoadingHandler>{children}</LoadingHandler>
        </main>
        <Footer />
      </ThemeWrapper>
    </LoadingProvider>
  );
};

export default SpecialLayoutComponent;