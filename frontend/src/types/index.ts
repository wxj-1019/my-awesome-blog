// 博客文章类型
export interface Post {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  image?: string;
  likes?: number;
  comments?: number;
}

// 友情链接类型
export interface FriendLink {
  id: string;
  name: string;
  url: string;
  favicon: string;
  avatar?: string;
  description?: string;
}

// 作品集类型
export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  link?: string;
}

// 时间轴类型
export interface TimelineItem {
  date: string;
  title: string;
  description: string;
}

// 后端时间轴事件类型
export interface BackendTimelineEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  is_active: boolean;
}

// 新的时间轴事件类型
export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}

// 统计数据类型
export interface Stat {
  label: string;
  value: number;
  icon: React.ElementType;
}

// 特色推荐类型
export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  link: string;
}

// 热门文章类型
export interface PopularPost {
  id: string;
  title: string;
  date: string;
}

// 用户相关类型
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
}

// 打字机内容类型
export interface TypewriterContent {
  id: string;
  text: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// 用户统计类型
export interface UserStats {
  article_count: number;
  comment_count: number;
  joined_date: string;
  total_views: number;
}

// 回复类型
export interface Reply {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  created_at: string;
  likes?: number;
  parent_id?: string; // 父回复ID，用于多级回复
  replies?: Reply[]; // 嵌套回复
  isEdited?: boolean;
  editedAt?: string;
  mentionedUsers?: string[]; // @的用户列表
}

// 留言/弹幕消息类型
export interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  created_at: string;
  updated_at?: string; // 更新时间（编辑后）
  color?: string; // 弹幕颜色
  isDanmaku?: boolean; // 是否以弹幕形式显示
  likes?: number; // 点赞数
  replies?: Reply[]; // 回复列表（楼中楼）
  parent_id?: string; // 父留言ID，用于多级回复
  reply_count?: number; // 回复总数（包括嵌套回复）
  level?: number; // 用户等级
  isEdited?: boolean; // 是否已编辑
  editedAt?: string; // 编辑时间
  tags?: string[]; // 标签
  isPinned?: boolean; // 是否置顶
  isFeatured?: boolean; // 是否精华
  mentionedUsers?: string[]; // @的用户列表
}

// 弹幕消息类型（扩展Message）
export interface DanmakuMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  created_at: string;
  color: string;
  speed: number; // 弹幕速度
  y: number; // 弹幕垂直位置
  layer: number; // 弹幕层级
}

// 创建留言请求类型
export interface CreateMessageRequest {
  content: string;
  color?: string;
  isDanmaku?: boolean;
}

// 相册类型
export interface Album {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  date: string;
  featured?: boolean;
  images: number;
  category?: string;
  likes?: number;
  views?: number;
  slug?: string;
  technologies?: string[];
  startDate?: string;
  endDate?: string;
  status?: string;
  sortOrder?: number;
}

// 相册过滤器类型
export interface AlbumFilters {
  filter: 'all' | 'featured' | 'recent' | 'popular';
  sort: 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';
  viewMode: 'grid' | 'list' | 'masonry';
}

// 后端文章类型（带作者信息）
export interface BackendArticleWithAuthor {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  published_at: string;
  read_time: number | null;
  cover_image: string | null;
  categories: Array<{
    id: string;
    name: string;
  }>;
  tags?: Array<{
    id: string;
    name: string;
  }>;
  author?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

// 文章数据类型
export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at: string;
  author_id: string;
  category_id?: string;
  cover_image?: string;
  read_time: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  author: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    bio?: string;
    reputation?: number;
    followers_count?: number;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
    description: string;
  };
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

// 分类类型
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  article_count: number;
}

// 标签类型
export interface Tag {
  id: string;
  name: string;
  slug: string;
  article_count: number;
}

// 评论类型
export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  likes: number;
  replies?: Comment[];
}

// 相关文章类型
export interface RelatedArticle {
  id: string;
  title: string;
  excerpt: string;
  published_at: string;
  category: {
    name: string;
  };
  view_count: number;
}

// LLM 相关类型
export type LLMProvider = 'deepseek' | 'glm' | 'qwen';

export interface LLMChatRequest {
  message: string;
  conversation_id?: string;
  provider?: LLMProvider;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  use_memory?: boolean;
  use_context?: boolean;
}

export interface LLMChatResponse {
  id: string;
  conversation_id: string;
  message: string;
  role: 'assistant' | 'user';
  tokens?: number;
  model: string;
  created_at: string;
}

export interface LLMStreamChunk {
  content: string;
  finish_reason: string | null;
}

export interface LLMProviderInfo {
  name: LLMProvider;
  display_name: string;
  models: LLMModel[];
}

export interface LLMModel {
  name: string;
  display_name: string;
  description?: string;
  max_tokens?: number;
  supports_streaming?: boolean;
}

// Prompt 相关类型
export interface Prompt {
  id: string;
  tenant_id: string;
  name: string;
  version: string;
  content: string;
  variables?: Record<string, any>;
  description?: string;
  category?: string;
  is_active: boolean;
  is_system: boolean;
  ab_test_group?: 'A' | 'B' | null;
  ab_test_percentage?: number;
  usage_count: number;
  success_rate: number;
  total_interactions: number;
  created_at: string;
  updated_at: string;
}

export interface PromptCreate {
  name: string;
  version: string;
  content: string;
  variables?: Record<string, any>;
  description?: string;
  category?: string;
  is_system?: boolean;
}

export interface PromptUpdate {
  name?: string;
  content?: string;
  variables?: Record<string, any>;
  description?: string;
  category?: string;
  is_active?: boolean;
}

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version: string;
  content: string;
  variables?: Record<string, any>;
  created_at: string;
}

export interface PromptListResponse {
  prompts: Prompt[];
  total: number;
  page: number;
  page_size: number;
}

export interface PromptFolder {
  id: string;
  name: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

export interface PromptWithFolder extends Prompt {
  folder_id?: string;
  folder?: PromptFolder;
  tags?: string[];
  is_default?: boolean;
}

export interface ABTestResult {
  prompt_id: string;
  group_a: {
    version: string;
    usage_count: number;
    success_rate: number;
  };
  group_b: {
    version: string;
    usage_count: number;
    success_rate: number;
  };
  winner?: 'A' | 'B' | null;
  statistical_significance?: number;
}

// Memory 相关类型
export interface Memory {
  id: string;
  tenant_id: string;
  user_id: string;
  memory_type: 'short_term' | 'long_term';
  content: string;
  embedding?: string;
  importance?: number;
  access_count: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryCreate {
  memory_type: 'short_term' | 'long_term';
  content: string;
  importance?: number;
  expires_at?: string;
}

export interface MemoryUpdate {
  content?: string;
  importance?: number;
  expires_at?: string;
}

export interface MemorySearchResult {
  memory: Memory;
  similarity_score: number;
}

export interface MemorySearchRequest {
  query: string;
  limit?: number;
  threshold?: number;
  memory_type?: 'short_term' | 'long_term' | 'all';
}

// Conversation 相关类型
export interface Conversation {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  status: 'active' | 'archived' | 'deleted';
  prompt_id?: string;
  model: string;
  total_messages: number;
  total_tokens: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationCreate {
  title: string;
  model?: string;
  prompt_id?: string;
}

export interface ConversationUpdate {
  title?: string;
  status?: 'active' | 'archived' | 'deleted';
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
  model?: string;
  created_at: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: ConversationMessage[];
}

// Tenant 相关类型
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  max_users: number;
  max_conversations: number;
  max_storage_mb: number;
  created_at: string;
  updated_at: string;
}

export interface TenantCreate {
  name: string;
  slug: string;
  description?: string;
  max_users?: number;
  max_conversations?: number;
  max_storage_mb?: number;
}

export interface TenantUpdate {
  name?: string;
  description?: string;
  is_active?: boolean;
  max_users?: number;
  max_conversations?: number;
  max_storage_mb?: number;
}

export interface TenantUsageStats {
  tenant_id: string;
  prompt_count: number;
  memory_count: number;
  conversation_count: number;
  message_count: number;
  storage_used_mb: number;
  storage_percentage: number;
  storage_limit_mb: number;
  status: string;
}

export interface TenantConfig {
  id: string;
  name: string;
  slug: string;
  description?: string;
  max_users: number;
  max_conversations: number;
  max_storage_mb: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantLimits {
  allowed: boolean;
  tenant_id?: string;
  limits?: {
    max_users: number;
    max_conversations: number;
    max_storage_mb: number;
  };
  reason?: string;
}

// 通用响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
}

// API 错误类型
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

// 网络请求状态
export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

// 用户认证相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
}

// 导航链接类型
export interface NavLink {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavLink[];
}

// 表单相关类型
export interface FormField<T = string> {
  name: string;
  label: string;
  value: T;
  error?: string;
  touched: boolean;
}

export type FormState<T> = {
  [K in keyof T]: FormField<T[K]>;
};

// UI 组件通用类型
export type SizeVariant = 'sm' | 'md' | 'lg' | 'xl';
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type Variant = 'default' | 'outline' | 'ghost' | 'link' | 'glass' | 'destructive';

// Toast 通知类型
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// 确认对话框类型
export type ConfirmDialogType = 'default' | 'danger' | 'warning' | 'success';
export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  type?: ConfirmDialogType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// 页面过渡动画类型
export type TransitionType = 'fade' | 'slide' | 'scale' | 'slide-up' | 'slide-down';
export interface PageTransitionProps {
  children: React.ReactNode;
  type?: TransitionType;
  duration?: number;
  className?: string;
}

// 加载状态类型
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

// 搜索相关类型
export interface SearchParams {
  query: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResults<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextPage?: number;
}

// 文件上传类型
export interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  preview?: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

// 响应式断点类型
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export interface ResponsiveValue<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}

// 主题相关类型
export type Theme = 'light' | 'dark' | 'auto';
export interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

// 错误边界类型
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// 性能监控类型
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  startTime: number;
  endTime: number;
  totalTime: number;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}