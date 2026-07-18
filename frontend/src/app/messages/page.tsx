import type { Metadata } from 'next';
import MessagesPageContent from './messages-content';

export const metadata: Metadata = {
  title: '留言板 - My Awesome Blog',
  description: '发送弹幕留言，与访问博客的朋友们实时互动。',
};

export default function MessagesPage() {
  return <MessagesPageContent />;
}
