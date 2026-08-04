import type { Metadata } from 'next';
import ChatPageContent from './chat-content';

export const metadata: Metadata = {
  title: '写作助手 - My Awesome Blog',
  description: '用 AI 辅助撰写、润色与管理站内文章内容，保存对话历史并快速选用提示词。',
};

export default function ChatPage() {
  return <ChatPageContent />;
}
