export interface GitHubStats {
  stars: number;
  forks: number;
  watchers: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  link: string;
  githubUrl: string;
  category: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'tools';
  githubStats?: GitHubStats;
}

export const mockProjects: Project[] = [
  {
    id: '1',
    title: '个人博客系统',
    description: '基于Next.js 14和FastAPI构建的现代化个人博客系统，支持Markdown渲染、评论系统等功能',
    image: '/assets/project-blog.jpg',
    tags: ['Next.js', 'FastAPI', 'TypeScript', 'Tailwind CSS'],
    link: 'https://myblog.com',
    githubUrl: 'https://github.com/username/myblog',
    category: 'fullstack',
    githubStats: {
      stars: 245,
      forks: 32,
      watchers: 18,
    },
  },
  {
    id: '2',
    title: 'React组件库',
    description: '一套基于React的UI组件库，提供丰富的基础组件和高级交互组件',
    image: '/assets/project-ui.jpg',
    tags: ['React', 'TypeScript', 'Storybook', 'Jest'],
    link: 'https://ui-library.com',
    githubUrl: 'https://github.com/username/ui-library',
    category: 'frontend',
    githubStats: {
      stars: 189,
      forks: 24,
      watchers: 12,
    },
  },
  {
    id: '3',
    title: 'API服务管理平台',
    description: '企业级API服务管理平台，提供API文档、监控、限流等功能',
    image: '/assets/project-api.jpg',
    tags: ['Python', 'FastAPI', 'PostgreSQL', 'Redis'],
    link: 'https://api-platform.com',
    githubUrl: 'https://github.com/username/api-platform',
    category: 'backend',
    githubStats: {
      stars: 156,
      forks: 28,
      watchers: 15,
    },
  },
  {
    id: '4',
    title: '移动端任务管理',
    description: '跨平台移动应用，支持离线使用、云同步、团队协作等功能',
    image: '/assets/project-mobile.jpg',
    tags: ['React Native', 'Redux', 'Firebase'],
    link: 'https://task-app.com',
    githubUrl: 'https://github.com/username/task-app',
    category: 'mobile',
    githubStats: {
      stars: 98,
      forks: 15,
      watchers: 8,
    },
  },
  {
    id: '5',
    title: '开发工具集合',
    description: '开发者效率工具集合，包括代码格式化、文件压缩、图片优化等工具',
    image: '/assets/project-tools.jpg',
    tags: ['JavaScript', 'Node.js', 'Electron'],
    link: 'https://dev-tools.com',
    githubUrl: 'https://github.com/username/dev-tools',
    category: 'tools',
    githubStats: {
      stars: 134,
      forks: 19,
      watchers: 11,
    },
  },
];

export const projectCategories = [
  { id: 'all' as const, label: '全部', count: 5, color: 'from-gray-500 to-gray-700' },
  { id: 'frontend' as const, label: '前端', count: 1, color: 'from-blue-500 to-cyan-500' },
  { id: 'backend' as const, label: '后端', count: 1, color: 'from-green-500 to-emerald-500' },
  { id: 'fullstack' as const, label: '全栈', count: 1, color: 'from-purple-500 to-pink-500' },
  { id: 'mobile' as const, label: '移动端', count: 1, color: 'from-orange-500 to-red-500' },
  { id: 'tools' as const, label: '工具', count: 1, color: 'from-yellow-500 to-orange-500' },
];
