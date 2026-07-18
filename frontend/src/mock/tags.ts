export interface TagItem {
  id: string;
  name: string;
  count: number;
  category: string;
  trend: number;
  color: string;
}

export const mockTags: TagItem[] = [
  { id: '1', name: 'React', count: 145, category: '前端', trend: 12, color: 'from-blue-500 to-cyan-500' },
  { id: '2', name: 'Next.js', count: 132, category: '前端', trend: 18, color: 'from-gray-700 to-gray-900' },
  { id: '3', name: 'TypeScript', count: 128, category: '前端', trend: 15, color: 'from-blue-600 to-blue-800' },
  { id: '4', name: 'Python', count: 98, category: '后端', trend: 8, color: 'from-yellow-500 to-yellow-600' },
  { id: '5', name: 'FastAPI', count: 87, category: '后端', trend: 22, color: 'from-green-500 to-green-700' },
  { id: '6', name: 'PostgreSQL', count: 76, category: '后端', trend: 5, color: 'from-blue-600 to-indigo-700' },
  { id: '7', name: 'Docker', count: 65, category: 'DevOps', trend: 10, color: 'from-blue-500 to-blue-600' },
  { id: '8', name: 'Git', count: 54, category: '工具', trend: 3, color: 'from-orange-500 to-red-500' },
  { id: '9', name: 'Tailwind CSS', count: 48, category: '前端', trend: 20, color: 'from-teal-400 to-teal-600' },
  { id: '10', name: 'GraphQL', count: 42, category: '后端', trend: 14, color: 'from-pink-500 to-purple-500' },
  { id: '11', name: 'AWS', count: 38, category: 'DevOps', trend: 7, color: 'from-orange-400 to-orange-600' },
  { id: '12', name: 'Redis', count: 35, category: '后端', trend: 11, color: 'from-red-500 to-red-700' },
];

export const tagCategories = [
  { id: 'all' as const, label: '全部', count: 948 },
  { id: '前端' as const, label: '前端', count: 453 },
  { id: '后端' as const, label: '后端', count: 286 },
  { id: 'DevOps' as const, label: 'DevOps', count: 103 },
  { id: '工具' as const, label: '工具', count: 106 },
];
