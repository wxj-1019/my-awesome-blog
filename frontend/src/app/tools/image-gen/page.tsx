import type { Metadata } from 'next';
import ImageGenContent from './image-gen-content';

export const metadata: Metadata = {
  title: '图片·视频生成 - My Awesome Blog',
  description: 'AI 生成工具：输入提示词，生成图片或视频，可预览与下载。',
};

/** 图片/视频生成（/tools/image-gen）：Server 组件，仅挂载 metadata 与客户端编排 */
export default function ImageGenPage() {
  return <ImageGenContent />;
}
