import type { Metadata } from 'next';
import ToolsHubContent from './tools-content';

export const metadata: Metadata = {
  title: '百宝箱 - My Awesome Blog',
  description: '模型对话与在线工具入口。',
};

export default function ToolsPage() {
  return <ToolsHubContent />;
}
