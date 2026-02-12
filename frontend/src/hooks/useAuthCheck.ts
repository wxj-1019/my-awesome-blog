import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUserApi } from '@/lib/api/auth';

/**
 * 自定义Hook：检查用户认证状态
 * 如果用户未认证，则重定向到登录页面
 */
export const useAuthCheck = (extraCondition?: () => boolean) => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUserApi();
      const conditionResult = extraCondition ? extraCondition() : true;

      if (!user || !conditionResult) {
        // 构造登录页面的完整URL
        const loginUrl = `/login?message=${encodeURIComponent('请先登录以查看您的个人资料')}&redirect=${encodeURIComponent(pathname)}`;
        
        // 使用 router.push 进行导航，保持 Next.js 客户端导航
        router.push(loginUrl);
      }
    };

    checkAuth();
  }, [extraCondition, pathname, router]);
};