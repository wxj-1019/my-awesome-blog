'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Loader2,
  FileText,
  Image as ImageIcon,
  Tag as TagIcon,
  FolderTree,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Minimize2,
  RefreshCw,
  X,
  Search,
  Wand2
} from 'lucide-react';
import Link from 'next/link';
import { adminApi } from '@/lib/admin-api-client';
import Button from '@/components/admin/Button';
import FormInput from '@/components/admin/FormInput';
import { useToast } from '@/components/admin/Toast';
import GlassCardAdmin from '@/components/ui/AdminGlassCard';

interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

type EditorMode = 'edit' | 'preview' | 'split';

const AUTOSAVE_INTERVAL = 30000;
const MIN_TITLE_LENGTH = 5;
const MIN_CONTENT_LENGTH = 100;

export default function NewArticlePage() {
  const router = useRouter();
  const { success, error, info } = useToast();
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    cover_image: '',
    is_published: false,
    category_id: '',
    tags: [] as string[]
  });

  const stats = {
    charCount: formData.content.length,
    wordCount: formData.content.trim() ? formData.content.trim().split(/\s+/).length : 0,
    readingTime: Math.max(1, Math.ceil(formData.content.trim().split(/\s+/).length / 200)),
    titleLength: formData.title.length
  };

  const formProgress = {
    title: formData.title.length >= MIN_TITLE_LENGTH,
    content: formData.content.length >= MIN_CONTENT_LENGTH,
    category: !!formData.category_id,
    tags: formData.tags.length > 0,
    excerpt: formData.excerpt.length > 0
  };

  const progressPercentage = Math.round(
    (Object.values(formProgress).filter(Boolean).length / Object.keys(formProgress).length) * 100
  );

  const validationErrors = {
    title: touchedFields.has('title') && formData.title.length < MIN_TITLE_LENGTH,
    content: touchedFields.has('content') && formData.content.length < MIN_CONTENT_LENGTH
  };

  const loadCategoriesAndTags = useCallback(async () => {
    try {
      setIsLoading(true);
      const [categoriesData, tagsData] = await Promise.all([
        adminApi.categories.list(),
        adminApi.tags.list()
      ]);
      setCategories(categoriesData || []);
      setTags(tagsData || []);
    } catch (err) {
      console.error('Failed to load categories and tags:', err);
      error('加载分类和标签失败');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadCategoriesAndTags();
  }, [loadCategoriesAndTags]);

  useEffect(() => {
    if (!isLoading && formData.content) {
      setHasUnsavedChanges(true);
    }
  }, [formData, isLoading]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handlePublish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const generateExcerpt = (content: string) => {
    const plainText = content.replace(/[#*`_\[\]]/g, '').trim();
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setTouchedFields(prev => new Set(prev).add('title'));
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setTouchedFields(prev => new Set(prev).add('content'));
    setFormData(prev => ({
      ...prev,
      content
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouchedFields(prev => new Set(prev).add(name));
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => {
      const newTags = prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId];
      return { ...prev, tags: newTags };
    });
  };

  const handleAutoExcerpt = () => {
    const excerpt = generateExcerpt(formData.content);
    setFormData(prev => ({ ...prev, excerpt }));
    info('已自动生成摘要');
  };

  const handleSaveDraft = useCallback(async () => {
    if (!formData.title.trim()) {
      error('请输入文章标题');
      return;
    }
    if (!formData.content.trim()) {
      error('请输入文章内容');
      return;
    }

    try {
      const submitData = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt || undefined,
        cover_image: formData.cover_image || undefined,
        is_published: false,
        category_id: formData.category_id || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined
      };

      await adminApi.articles.create(submitData);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      success('草稿已保存');
    } catch (err: unknown) {
      console.error('Failed to save draft:', err);
      const errorMessage = err instanceof Error ? err.message : '保存草稿失败';
      error(errorMessage);
    }
  }, [formData, success, error, info]);

  const handlePublish = async () => {
    if (!formData.title.trim()) {
      error('请输入文章标题');
      titleInputRef.current?.focus();
      return;
    }

    if (!formData.slug.trim()) {
      error('请输入文章别名');
      return;
    }

    if (!formData.content.trim()) {
      error('请输入文章内容');
      return;
    }

    try {
      setIsSubmitting(true);

      const submitData = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt || undefined,
        cover_image: formData.cover_image || undefined,
        is_published: true,
        category_id: formData.category_id || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined
      };

      await adminApi.articles.create(submitData);

      success('文章发布成功');
      setHasUnsavedChanges(false);
      router.push('/admin/articles');
    } catch (err: unknown) {
      console.error('Failed to publish article:', err);
      const errorMessage = err instanceof Error ? err.message : '发布文章失败';
      error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

  const renderPreview = () => {
    return (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <h1>{formData.title || '未命名文章'}</h1>
        {formData.excerpt && <p className="text-lg text-slate-600 dark:text-slate-400">{formData.excerpt}</p>}
        <div className="whitespace-pre-wrap">{formData.content || '暂无内容...'}</div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Loader2 className="w-10 h-10 animate-spin text-tech-cyan" />
          <span className="text-foreground/60">加载中...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-6 overflow-auto' : ''}`}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-4">
          <Link href="/admin/articles">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回列表
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-tech-cyan" />
              新建文章
            </h1>
            <p className="text-sm text-foreground/60 mt-1">创建一篇新的博客文章</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastSaved && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-sm text-foreground/60"
            >
              <Clock className="w-4 h-4" />
              上次保存: {lastSaved.toLocaleTimeString()}
            </motion.div>
          )}
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              未保存更改
            </span>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <GlassCardAdmin variant="secondary" className="p-6" hoverEffect={false}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-tech-cyan" />
                <h2 className="text-lg font-semibold text-foreground">文章内容</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-background/30 rounded-lg p-1">
                  {(['edit', 'split', 'preview'] as EditorMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setEditorMode(mode)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        editorMode === mode
                          ? 'bg-tech-cyan text-white shadow-sm'
                          : 'text-foreground/70 hover:text-foreground hover:bg-background/50'
                      }`}
                    >
                      {mode === 'edit' ? '编辑' : mode === 'split' ? '分屏' : '预览'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-lg bg-background/30 hover:bg-background/50 text-foreground/70 hover:text-foreground transition-all"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground/80">
                    文章标题 <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-xs ${stats.titleLength < MIN_TITLE_LENGTH ? 'text-amber-500' : 'text-green-500'}`}>
                    {stats.titleLength} 字符
                  </span>
                </div>
                <input
                  ref={titleInputRef}
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="输入一个吸引人的标题..."
                  className={`w-full px-4 py-3 rounded-xl bg-background/50 border text-foreground text-lg font-medium placeholder:text-foreground/40 focus:outline-none focus:ring-2 transition-all ${
                    validationErrors.title
                      ? 'border-red-500/50 focus:ring-red-500/20'
                      : 'border-border/50 focus:ring-tech-cyan/20 focus:border-tech-cyan/50'
                  }`}
                  required
                />
                {validationErrors.title && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-500 mt-1 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    标题至少需要 {MIN_TITLE_LENGTH} 个字符
                  </motion.p>
                )}
              </div>

              <FormInput
                label="文章别名 (Slug)"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="article-url-slug"
                leftIcon={() => <span className="text-foreground/40 text-sm">/</span>}
                required
              />

              <div className={`${editorMode === 'split' ? 'grid grid-cols-2 gap-4' : ''}`}>
                <div className={editorMode === 'preview' ? 'hidden' : ''}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-foreground/80">
                      文章内容 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-3 text-xs text-foreground/50">
                      <span>{stats.wordCount} 词</span>
                      <span>·</span>
                      <span>约 {stats.readingTime} 分钟阅读</span>
                    </div>
                  </div>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleContentChange}
                    placeholder="使用 Markdown 格式编写文章内容..."
                    rows={editorMode === 'split' ? 20 : 18}
                    className={`w-full px-4 py-3 rounded-xl bg-background/50 border text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 transition-all resize-none font-mono text-sm ${
                      validationErrors.content
                        ? 'border-red-500/50 focus:ring-red-500/20'
                        : 'border-border/50 focus:ring-tech-cyan/20 focus:border-tech-cyan/50'
                    }`}
                    required
                  />
                  {validationErrors.content && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-500 mt-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      内容至少需要 {MIN_CONTENT_LENGTH} 个字符
                    </motion.p>
                  )}
                </div>

                {(editorMode === 'split' || editorMode === 'preview') && (
                  <div className={editorMode === 'split' ? '' : 'mt-4'}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-foreground/80">预览</label>
                    </div>
                    <div className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border/50 min-h-[300px] overflow-auto">
                      {renderPreview()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GlassCardAdmin>

          <GlassCardAdmin variant="secondary" className="p-6" hoverEffect={false}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-tech-cyan" />
                <h2 className="text-lg font-semibold text-foreground">附加信息</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground/80">文章摘要</label>
                  <button
                    type="button"
                    onClick={handleAutoExcerpt}
                    className="flex items-center gap-1 text-xs text-tech-cyan hover:text-tech-cyan/80 transition-colors"
                  >
                    <Wand2 className="w-3 h-3" />
                    自动生成
                  </button>
                </div>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  placeholder="简短描述文章内容，用于 SEO 和列表展示..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border/50 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-tech-cyan/20 focus:border-tech-cyan/50 transition-all resize-none text-sm"
                />
                <p className="text-xs text-foreground/50 mt-1">{formData.excerpt.length} / 200 字符</p>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-4 h-4 text-foreground/60" />
                  <label className="block text-sm font-medium text-foreground/80">封面图片 URL</label>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    name="cover_image"
                    value={formData.cover_image}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-4 py-3 rounded-xl bg-background/50 border border-border/50 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-tech-cyan/20 focus:border-tech-cyan/50 transition-all"
                  />
                </div>
                {formData.cover_image && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 relative"
                  >
                    <img
                      src={formData.cover_image}
                      alt="封面预览"
                      className="w-full h-40 object-cover rounded-xl border border-border/50"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </GlassCardAdmin>
        </div>

        <div className="space-y-6">
          <GlassCardAdmin variant="secondary" className="p-6" hoverEffect={false}>
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <div
                  className={`h-2 rounded-full bg-background/50 overflow-hidden ${progressPercentage === 100 ? 'animate-pulse' : ''}`}
                >
                  <motion.div
                    className={`h-full rounded-full transition-colors ${
                      progressPercentage === 100 ? 'bg-green-500' : 'bg-tech-cyan'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-foreground/70">{progressPercentage}%</span>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm">
                {formProgress.title ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-border/50" />
                )}
                <span className={formProgress.title ? 'text-foreground/70' : 'text-foreground/40'}>
                  标题
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {formProgress.content ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-border/50" />
                )}
                <span className={formProgress.content ? 'text-foreground/70' : 'text-foreground/40'}>
                  内容
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {formProgress.category ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-border/50" />
                )}
                <span className={formProgress.category ? 'text-foreground/70' : 'text-foreground/40'}>
                  分类
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {formProgress.tags ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-border/50" />
                )}
                <span className={formProgress.tags ? 'text-foreground/70' : 'text-foreground/40'}>
                  标签
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {formProgress.excerpt ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-border/50" />
                )}
                <span className={formProgress.excerpt ? 'text-foreground/70' : 'text-foreground/40'}>
                  摘要
                </span>
              </div>
            </div>

            <div className="text-xs text-foreground/50 space-y-1">
              <p className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background/50 rounded text-[10px]">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 bg-background/50 rounded text-[10px]">S</kbd>
                <span>保存草稿</span>
              </p>
              <p className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background/50 rounded text-[10px]">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 bg-background/50 rounded text-[10px]">Enter</kbd>
                <span>发布文章</span>
              </p>
            </div>
          </GlassCardAdmin>

          <GlassCardAdmin variant="secondary" className="p-6" hoverEffect={false}>
            <div className="flex items-center gap-2 mb-4">
              <FolderTree className="w-5 h-5 text-tech-cyan" />
              <h2 className="text-lg font-semibold text-foreground">分类与标签</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/80">文章分类</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleSelectChange}
                  className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-tech-cyan/20 focus:border-tech-cyan/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="">选择分类...</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/80">文章标签</label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                    <input
                      type="text"
                      placeholder="搜索标签..."
                      value={tagSearchQuery}
                      onChange={(e) => setTagSearchQuery(e.target.value)}
                      onFocus={() => setShowTagDropdown(true)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background/50 border border-border/50 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-tech-cyan/20 focus:border-tech-cyan/50 transition-all text-sm"
                    />
                  </div>

                  <AnimatePresence>
                    {showTagDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-20 w-full mt-2 p-2 rounded-xl bg-background/95 backdrop-blur-xl border border-border/50 shadow-lg max-h-48 overflow-y-auto"
                      >
                        {filteredTags.length === 0 ? (
                          <p className="text-sm text-foreground/50 text-center py-2">暂无匹配标签</p>
                        ) : (
                          filteredTags.map(tag => (
                            <motion.button
                              key={tag.id}
                              type="button"
                              onClick={() => handleTagToggle(tag.id)}
                              className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-all flex items-center justify-between ${
                                formData.tags.includes(tag.id)
                                  ? 'bg-tech-cyan/20 text-tech-cyan'
                                  : 'hover:bg-background/50 text-foreground/70'
                              }`}
                              whileHover={{ x: 2 }}
                            >
                              <span className="flex items-center gap-2">
                                <TagIcon className="w-3 h-3" />
                                {tag.name}
                              </span>
                              {formData.tags.includes(tag.id) && (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </motion.button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <AnimatePresence mode="popLayout">
                      {formData.tags.map(tagId => {
                        const tag = tags.find(t => t.id === tagId);
                        if (!tag) return null;
                        return (
                          <motion.span
                            key={tagId}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tech-cyan/20 text-tech-cyan text-xs font-medium"
                          >
                            {tag.name}
                            <button
                              type="button"
                              onClick={() => handleTagToggle(tagId)}
                              className="hover:bg-tech-cyan/30 rounded-full p-0.5 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.span>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </GlassCardAdmin>

          <GlassCardAdmin variant="accent" className="p-6" hoverEffect={false}>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Send className="w-5 h-5" />
              发布操作
            </h2>

            <div className="space-y-3">
              <Button
                type="button"
                variant="primary"
                className="w-full"
                disabled={isSubmitting || progressPercentage < 40}
                onClick={handlePublish}
                glowEffect
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                发布文章
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={isSubmitting}
                onClick={handleSaveDraft}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                保存草稿
              </Button>

              <div className="pt-3 border-t border-border/30">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  预览文章
                </Button>
              </div>
            </div>

            {progressPercentage < 40 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-amber-500 mt-3 text-center"
              >
                请完成至少 40% 的内容再发布
              </motion.p>
            )}
          </GlassCardAdmin>
        </div>
      </div>

      {showTagDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowTagDropdown(false)}
        />
      )}
    </div>
  );
}
