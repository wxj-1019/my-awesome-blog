import type { Metadata } from 'next';
import ChatPageContent from './chat-content';

export const metadata: Metadata = {
  title: 'AI 对话 - My Awesome Blog',
  description: '与 AI 助手进行流式对话，管理会话并使用大语言模型解答问题。',
};

export default function ChatPage() {
  return <ChatPageContent />;
}
