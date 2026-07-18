export interface FriendLink {
  id: string;
  name: string;
  url: string;
  favicon: string;
  description?: string;
}

export const mockFriendLinks: FriendLink[] = [
  {
    id: '1',
    name: 'Next.js',
    url: 'https://nextjs.org',
    favicon: '/assets/nextjs-logo.svg',
    description: '生产就绪的React框架',
  },
  {
    id: '2',
    name: 'Vercel',
    url: 'https://vercel.com',
    favicon: '/assets/vercel-logo.svg',
    description: '开发. 预览. 部署.',
  },
  {
    id: '3',
    name: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    favicon: '/assets/tailwind-logo.svg',
    description: '快速构建现代网站',
  },
  {
    id: '4',
    name: 'Radix UI',
    url: 'https://www.radix-ui.com',
    favicon: '/assets/radix-logo.svg',
    description: '无样式、可访问的UI组件',
  },
];
