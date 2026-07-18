import type { Metadata } from 'next';
import ChatPageContent from './chat-content';

export const metadata: Metadata = {
  title: 'AI 聊天 - My Awesome Blog',
  description: '与 AI 助手进行多会话聊天，保存对话历史并快速选用提示词。',
};

export default function ChatPage() {
  return <ChatPageContent />;
}
