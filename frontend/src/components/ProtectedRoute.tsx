'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUserApi } from '@/lib/api/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback = null, 
  redirectTo = '/login' 
}) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async (attempt: number = 0) => {
      try {

        const user = await getCurrentUserApi();
        
        if (!isMounted) {return;}

        if (user) {

          setIsAuthorized(true);
        } else {

          setIsAuthorized(false);
          // 重定向到登录页面，并保留原始路径
          const encodedRedirectPath = encodeURIComponent(pathname);
          const loginUrl = `${redirectTo}?message=${encodeURIComponent('请先登录以查看此页面')}&redirect=${encodedRedirectPath}`;

          router.push(loginUrl as never);
        }
      } catch (error) {
        console.error('[ProtectedRoute] 认证检查错误:', error);
        
        if (!isMounted) {return;}

        // 如果是第一次尝试失败，再重试几次
        if (attempt < 3) {

          setTimeout(() => {
            if (isMounted) {checkAuth(attempt + 1);}
          }, 300);
        } else {
          setIsAuthorized(false);
          const encodedRedirectPath = encodeURIComponent(pathname);
          const loginUrl = `${redirectTo}?message=${encodeURIComponent('请先登录以查看此页面')}&redirect=${encodedRedirectPath}`;

          router.push(loginUrl as never);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, redirectTo, router]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300">
        <div className="text-center">
          <p className="text-foreground">检查认证状态中...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized) {
    return <>{children}</>;
  }

  return fallback;
};

export default ProtectedRoute;