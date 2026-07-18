import type { Metadata } from 'next';
import UnauthorizedPageContent from './unauthorized-content';

export const metadata: Metadata = {
  title: '权限不足 - My Awesome Blog',
  description: '您需要登录才能访问此页面，请先登录账户。',
};

export default function UnauthorizedPage() {
  return <UnauthorizedPageContent />;
}
