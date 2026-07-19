import type { Metadata } from 'next';
import OnlineToolsContent from './online-tools-content';

export const metadata: Metadata = {
  title: '在线工具 - My Awesome Blog',
  description: '实用在线小工具集合（持续完善中）。',
};

export default function OnlineToolsPage() {
  return <OnlineToolsContent />;
}
