'use client';

/**
 * 文章编辑器共享表单组件。
 *
 * 历史背景：admin/articles/new 与 admin/articles/[id] 两个页面曾各自复制了
 * 内容卡片（模式切换/全屏/标题/slug/AI 工具组/Tiptap 编辑器/预览）、附加信息
 * 卡片（摘要/封面/附件）、进度侧栏、分类标签、发布操作等 JSX（约 500 行重复）。
 * 统一抽取到这里；两页本质差异（发布区文案、预览方式、AI 协助面板）通过 props
 * 与 sidebarExtra 插槽注入。
 */
import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import {
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
  X,
  Search,
  Wand2,
  Info
} from 'lucide-react';
import Button from '@/components/admin/Button';
import FormInput from '@/components/admin/FormInput';
import GlassCardAdmin from '@/components/ui/GlassCardAdmin';
import CoverPicker from '@/components/admin/CoverPicker';
import {
  ArticlePreview,
  MIN_TITLE_LENGTH,
  MIN_CONTENT_LENGTH,
  type EditorMode,
} from '@/components/admin/article-editor/shared';
import { ArticleAttachmentsEditor } from '@/components/admin/article-editor/ArticleAttachmentsEditor';
import type { ArticleEditorController } from '@/components/admin/article-editor/useArticleEditorForm';

// TipTap 所见即所得编辑器：客户端专用，dynamic 关闭 SSR
const TiptapEditor = dynamic(
  () => import('@/components/admin/article-editor/TiptapEditor'),
  { ssr: false, loading: () => <div className="h-[420px] rounded-xl border border-border/50 bg-background/50 animate-pulse" /> }
);

export interface ArticleEditorFormProps {
  /** useArticleEditorForm 返回的表单控制器 */
  form: ArticleEditorController;
  /** 保存草稿回调（两页请求链路不同，由页面实现） */
  onSaveDraft: () => void;
  /** 发布回调（两页请求链路不同，由页面实现） */
  onPublish: () => void;
  /** 发布区卡片标题：new「发布操作」/ [id]「保存操作」 */
  publishCardTitle: string;
  /** 发布主按钮文案：[id] 页随 is_published 变化（更新并发布/发布文章） */
  publishButtonLabel: string;
  /** 保存按钮文案：new「保存草稿」/ [id]「保存更改」 */
  saveButtonLabel: string;
  /** 快捷键说明文案：new「保存草稿」/ [id]「保存文章」 */
  saveShortcutLabel: string;
  /**
   * 预览方式：internal=切到内置预览模式（new 页）；
   * external=新窗口打开 /posts/{slug}（[id] 页）
   */
  previewMode: 'internal' | 'external';
  /** 右侧栏附加插槽（AI 协助面板等页面特有内容，渲染在进度卡之后） */
  sidebarExtra?: ReactNode;
}

/**
 * 文章编辑器表单主体：左侧内容/附加信息卡 + 右侧进度/AI 协助/分类标签/发布卡。
 * 仅负责渲染与输入分发，保存/发布请求链路在各自页面。
 */
export default function ArticleEditorForm({
  form,
  onSaveDraft,
  onPublish,
  publishCardTitle,
  publishButtonLabel,
  saveButtonLabel,
  saveShortcutLabel,
  previewMode,
  sidebarExtra,
}: ArticleEditorFormProps) {
  const {
    formData,
    setFormData,
    setTouchedFields,
    setHasUnsavedChanges,
    isSubmitting,
    editorMode,
    setEditorMode,
    isFullscreen,
    setIsFullscreen,
    tagSearchQuery,
    setTagSearchQuery,
    showTagDropdown,
    setShowTagDropdown,
    filteredTags,
    categories,
    tags,
    stats,
    formProgress,
    progressPercentage,
    validationErrors,
    handleTitleChange,
    handleInputChange,
    handleTagToggle,
    handleAutoExcerpt,
    isAiBusy,
    polishing,
    handleAiPolish,
    generatingMeta,
    handleAiMeta,
    aiSummaryLoading,
    aiSummaryContentTooShort,
    handleAiSummary,
    titleInputRef,
  } = form;

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <GlassCardAdmin className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-tech-cyan/10">
                  <FileText className="w-5 h-5 text-tech-cyan" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">文章内容</h2>
                  <p className="text-xs text-foreground/50">使用 Markdown 格式编写</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-background/30 rounded-lg p-1">
                  {(['edit', 'split', 'preview'] as EditorMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setEditorMode(mode)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        editorMode === mode
                          ? 'bg-tech-cyan text-foreground shadow-sm shadow-tech-cyan/20'
                          : 'text-foreground/60 hover:text-foreground hover:bg-background/50'
                      }`}
                    >
                      {mode === 'edit' ? '编辑' : mode === 'split' ? '分屏' : '预览'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-lg bg-background/30 hover:bg-background/50 text-foreground/60 hover:text-foreground transition-colors border border-transparent hover:border-border/30"
                  title={isFullscreen ? '退出全屏' : '全屏编辑'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground/80">
                    文章标题 <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      stats.titleLength < MIN_TITLE_LENGTH
                        ? 'text-warning bg-warning/10'
                        : 'text-success bg-success/10'
                    }`}>
                      {stats.titleLength} 字符
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    ref={titleInputRef}
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="输入一个吸引人的标题..."
                    className={`w-full px-4 py-3.5 rounded-xl bg-background/50 border text-foreground text-lg font-medium placeholder:text-foreground/30 focus:outline-none focus:ring-2 transition-colors ${
                      validationErrors.title
                        ? 'border-destructive/50 focus:ring-destructive/20'
                        : 'border-border/50 focus:ring-tech-cyan/20 focus:border-tech-cyan/50'
                    }`}
                    required
                  />
                  {formData.title && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {formProgress.title ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-warning" />
                      )}
                    </div>
                  )}
                </div>
                {validationErrors.title && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-destructive mt-2 flex items-center gap-1.5"
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
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-foreground/80">
                      文章内容 <span className="text-destructive">*</span>
                    </label>
                    <div className="flex items-center gap-3 text-xs text-foreground/40">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {stats.wordCount} 词
                      </span>
                      <span className="w-1 h-1 rounded-full bg-foreground/20" />
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        约 {stats.readingTime} 分钟
                      </span>
                    </div>
                  </div>

                  <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
                    {/* AI 工具组：润色全文 / 生成标题摘要 */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleAiPolish}
                        disabled={!formData.content.trim() || isAiBusy}
                        title="对全文进行 AI 润色（流式替换）"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {polishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                        {polishing ? '润色中' : 'AI 润色'}
                      </button>
                      <button
                        type="button"
                        onClick={handleAiMeta}
                        disabled={!formData.content.trim() || isAiBusy}
                        title="根据正文生成标题、别名和摘要"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-cat-2/10 text-cat-2 hover:bg-cat-2/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {generatingMeta ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {generatingMeta ? '生成中' : '生成标题摘要'}
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="relative">
                      <TiptapEditor
                        content={formData.content}
                        onChange={(md) => {
                          setTouchedFields((prev) => new Set(prev).add('content'));
                          setHasUnsavedChanges(true);
                          setFormData((prev) => ({ ...prev, content: md }));
                        }}
                        onSelectionChange={form.setEditorSelection}
                        disabled={polishing}
                        invalid={Boolean(validationErrors.content)}
                        minHeight={editorMode === 'split' ? 480 : 420}
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-foreground/30 pointer-events-none">
                        {stats.charCount} 字符
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-3 text-xs text-foreground/30">
                      {stats.charCount} 字符
                    </div>
                  </div>
                  {validationErrors.content && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-destructive mt-2 flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3 h-3" />
                      内容至少需要 {MIN_CONTENT_LENGTH} 个字符
                    </motion.p>
                  )}
                </div>
                {(editorMode === 'split' || editorMode === 'preview') && (
                  <div className={editorMode === 'split' ? '' : 'mt-4'}>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-foreground/80 flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        实时预览
                      </label>
                    </div>
                    <div className="w-full px-5 py-4 rounded-xl bg-background/30 border border-border/30 min-h-[300px] overflow-auto">
                      <ArticlePreview
                        title={formData.title}
                        excerpt={formData.excerpt}
                        content={formData.content}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GlassCardAdmin>
          <GlassCardAdmin className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-cat-2/10">
                <Sparkles className="w-5 h-5 text-cat-2" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">附加信息</h2>
                <p className="text-xs text-foreground/50">SEO 优化和文章元数据</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground/80">文章摘要</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleAutoExcerpt}
                      className="flex items-center gap-1.5 text-xs text-tech-cyan hover:text-tech-cyan/80 transition-colors bg-tech-cyan/10 px-2.5 py-1 rounded-md"
                    >
                      <Wand2 className="w-3 h-3" />
                      自动生成
                    </button>
                    {/* AI 生成摘要：调 /ai/article-summary；正文太短时禁用并提示 */}
                    <button
                      type="button"
                      onClick={handleAiSummary}
                      disabled={aiSummaryLoading || aiSummaryContentTooShort}
                      title={aiSummaryContentTooShort
                        ? '正文内容太少，先写一些内容再用 AI 生成摘要'
                        : '根据标题和正文用 AI 生成摘要'}
                      className="inline-flex items-center gap-1 text-xs text-cat-2 hover:text-cat-2/80 transition-colors bg-cat-2/10 px-2.5 py-1 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {aiSummaryLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {aiSummaryLoading ? '生成中' : 'AI 生成摘要'}
                    </button>
                  </div>
                </div>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  placeholder="简短描述文章内容，用于 SEO 和列表展示..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border/50 text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-tech-cyan/20 focus:border-tech-cyan/50 transition-colors resize-none text-sm"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-foreground/40">用于搜索引擎和社交分享</p>
                  <p className={`text-xs ${formData.excerpt.length > 200 ? 'text-warning' : 'text-foreground/40'}`}>
                    {formData.excerpt.length} / 200
                  </p>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-4 h-4 text-foreground/50" />
                  <label className="block text-sm font-medium text-foreground/80">封面图片 URL</label>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    name="cover_image"
                    value={formData.cover_image}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-4 py-3 rounded-xl bg-background/50 border border-border/50 text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-tech-cyan/20 focus:border-tech-cyan/50 transition-colors"
                  />
                </div>
                {/* AI 自动找封面：读正文生成搜索词 → Unsplash 候选 → 点选填入 */}
                <CoverPicker
                  content={formData.content}
                  onPick={url => {
                    setFormData(prev => ({ ...prev, cover_image: url }));
                    setHasUnsavedChanges(true);
                  }}
                  busy={isAiBusy}
                />
                {formData.cover_image && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 relative group"
                  >
                    {/* 封面 URL 由用户任意填写，域名不可控，保留 <img> */}
                    <img
                      src={formData.cover_image}
                      alt="封面预览"
                      className="w-full h-48 object-cover rounded-xl border border-border/30"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                )}
              </div>
              {/* 文章资料：图片/视频/音频/文档，可标记「仅作者参考」 */}
              <div className="md:col-span-2 mt-4">
                <ArticleAttachmentsEditor
                  value={formData.attachments}
                  onChange={(attachments) => setFormData(prev => ({ ...prev, attachments }))}
                />
              </div>
            </div>
          </GlassCardAdmin>
        </div>
        <div className="space-y-6">
          <GlassCardAdmin className="p-5 sticky top-20">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <div className={`h-2 rounded-full overflow-hidden ${progressPercentage === 100 ? 'animate-pulse' : ''} bg-background/50`}>
                  <motion.div
                    className={`h-full rounded-full transition-colors ${
                      progressPercentage === 100 ? 'bg-success' : progressPercentage >= 60 ? 'bg-tech-cyan' : 'bg-warning'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
              <span className={`text-sm font-bold ${
                progressPercentage === 100 ? 'text-success' : 'text-foreground/60'
              }`}>{progressPercentage}%</span>
            </div>
            <div className="space-y-2.5 mb-5">
              {[
                { key: 'title', label: '标题' },
                { key: 'content', label: '内容' },
                { key: 'category', label: '分类' },
                { key: 'tags', label: '标签' },
                { key: 'excerpt', label: '摘要' }
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-2.5 text-sm">
                  <div className="w-5 h-5 flex items-center justify-center">
                    {formProgress[item.key as keyof typeof formProgress] ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      </motion.div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-foreground/20" />
                    )}
                  </div>
                  <span className={formProgress[item.key as keyof typeof formProgress] ? 'text-foreground/70' : 'text-foreground/40'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-background/30 border border-border/20">
              <div className="flex items-center gap-2 text-xs text-foreground/50 mb-2">
                <Info className="w-3 h-3" />
                <span>快捷键</span>
              </div>
              <div className="text-xs text-foreground/40 space-y-1.5">
                <p className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-background/50 rounded text-[10px] font-mono">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 bg-background/50 rounded text-[10px] font-mono">S</kbd>
                  <span className="ml-1">{saveShortcutLabel}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-background/50 rounded text-[10px] font-mono">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 bg-background/50 rounded text-[10px] font-mono">Enter</kbd>
                  <span className="ml-1">发布文章</span>
                </p>
              </div>
            </div>
          </GlassCardAdmin>
          {/* AI 协助面板等页面特有侧栏内容 */}
          {sidebarExtra}
          <GlassCardAdmin className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-cat-1/10">
                <FolderTree className="w-4 h-4 text-cat-1" />
              </div>
              <h2 className="text-base font-semibold text-foreground">分类与标签</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/70">文章分类</label>

                <div className="flex flex-wrap gap-2">
                  {categories.length === 0 ? (
                    <p className="text-xs text-foreground/40">暂无可选分类</p>
                  ) : (
                    categories.map(category => {
                      const checked = formData.category_ids.includes(category.id);
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() =>
                            setFormData(prev => ({
                              ...prev,
                              category_ids: checked
                                ? prev.category_ids.filter(id => id !== category.id)
                                : [...prev.category_ids, category.id],
                            }))
                          }
                          aria-pressed={checked}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                            checked
                              ? 'bg-primary/15 border-primary/40 text-primary'
                              : 'bg-background/50 border-border/50 text-foreground/70 hover:border-primary/30'
                          }`}
                        >
                          {category.name}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/70">文章标签</label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                    <input
                      type="text"
                      placeholder="搜索标签..."
                      value={tagSearchQuery}
                      onChange={(e) => setTagSearchQuery(e.target.value)}
                      onFocus={() => setShowTagDropdown(true)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background/50 border border-border/50 text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-tech-cyan/20 focus:border-tech-cyan/50 transition-colors text-sm"
                    />
                  </div>
                  <AnimatePresence>
                    {showTagDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-20 w-full mt-2 p-2 rounded-xl bg-background/95 backdrop-blur-xl border border-border/50 shadow-xl max-h-48 overflow-y-auto"
                      >
                        {filteredTags.length === 0 ? (
                          <p className="text-sm text-foreground/40 text-center py-3">暂无匹配标签</p>
                        ) : (
                          filteredTags.map(tag => (
                            <motion.button
                              key={tag.id}
                              type="button"
                              onClick={() => handleTagToggle(tag.id)}
                              className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-colors flex items-center justify-between cursor-pointer ${
                                formData.tags.includes(tag.id)
                                  ? 'bg-tech-cyan/20 text-tech-cyan'
                                  : 'hover:bg-background/50 text-foreground/60'
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
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <AnimatePresence mode="popLayout">
                      {formData.tags.map(tagId => {
                        const tag = tags.find(t => t.id === tagId);
                        if (!tag) {return null;}
                        return (
                          <motion.span
                            key={tagId}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tech-cyan/15 text-tech-cyan text-xs font-medium border border-tech-cyan/20"
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
          <GlassCardAdmin className="p-5">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-success/10">
                <Send className="w-4 h-4 text-success" />
              </div>
              {publishCardTitle}
            </h2>
            <div className="space-y-3">
              <Button
                type="button"
                variant="primary"
                className="w-full justify-center"
                disabled={isSubmitting || progressPercentage < 40}
                onClick={onPublish}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {publishButtonLabel}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full justify-center"
                disabled={isSubmitting}
                onClick={onSaveDraft}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saveButtonLabel}
              </Button>
              <div className="pt-3 border-t border-border/20">
                {previewMode === 'external' ? (
                  <Link href={`/posts/${formData.slug}`} target="_blank">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-center"
                      disabled={isSubmitting || !formData.slug}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      预览文章
                    </Button>
                  </Link>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-center"
                    disabled={isSubmitting}
                    onClick={() => setEditorMode('preview')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    预览文章
                  </Button>
                )}
              </div>
            </div>
            {progressPercentage < 40 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20"
              >
                <p className="text-xs text-warning flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  请完成至少 40% 的内容再发布
                </p>
              </motion.div>
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
    </>
  );
}
