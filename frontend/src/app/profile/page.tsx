import type { Metadata } from 'next';
import ProfilePageContent from './profile-content';

export const metadata: Metadata = {
  title: '个人中心 - My Awesome Blog',
  description: '管理您的个人资料、账户设置与活动统计。',
};

export default function ProfilePage() {
  return <ProfilePageContent />;
}
