export interface MediaItem {
  type: 'image' | 'video' | 'article';
  url: string;
  title: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  badge?: {
    type: 'milestone' | 'achievement' | 'award' | 'project';
    label: string;
    color: string;
  };
  media?: MediaItem[];
  link?: string;
}

export const mockEvents: TimelineEvent[] = [
  {
    id: '1',
    date: '2024-12',
    title: '完成100篇技术博客',
    description: '坚持写作100篇技术博客，分享前端、后端和DevOps相关的知识和经验',
    badge: {
      type: 'milestone',
      label: '里程碑',
      color: 'from-purple-500 to-pink-500',
    },
  },
  {
    id: '2',
    date: '2024-10',
    title: '开源项目获得500+ Star',
    description: '个人开源项目在GitHub上获得超过500个Star，感谢社区的支持',
    badge: {
      type: 'achievement',
      label: '成就',
      color: 'from-yellow-500 to-orange-500',
    },
    media: [
      { type: 'image', url: '/assets/project-screenshot.jpg', title: '项目截图' },
    ],
    link: 'https://github.com/yourproject',
  },
  {
    id: '3',
    date: '2024-08',
    title: '技术文章被推荐',
    description: '多篇技术文章被掘金、知乎等平台推荐，累计阅读量超过10万',
    badge: {
      type: 'award',
      label: '荣誉',
      color: 'from-red-500 to-pink-500',
    },
    media: [
      { type: 'article', url: '/articles/featured', title: '推荐文章' },
    ],
  },
  {
    id: '4',
    date: '2024-06',
    title: '发布第一个开源项目',
    description: '正式发布第一个开源项目，为开发者提供实用的工具库',
    badge: {
      type: 'project',
      label: '项目',
      color: 'from-blue-500 to-cyan-500',
    },
    media: [
      { type: 'video', url: '/assets/project-demo.mp4', title: '项目演示' },
    ],
    link: 'https://github.com/yourproject',
  },
  {
    id: '5',
    date: '2024-03',
    title: '开始技术博客之旅',
    description: '创建个人技术博客，开始系统性地记录学习和成长历程',
    badge: {
      type: 'milestone',
      label: '起点',
      color: 'from-green-500 to-emerald-500',
    },
  },
];
