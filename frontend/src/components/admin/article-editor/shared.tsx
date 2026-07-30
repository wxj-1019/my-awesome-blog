'use client';

/**
 * 文章编辑器共享模块。
 *
 * 历史背景：admin/articles/new 与 admin/articles/[id] 两个页面曾各自
 * 复制了 MarkdownToolbar / generateExcerpt / renderPreview 等实现
 * （约 700 行重复代码），且「实时预览」只是纯文本 whitespace-pre-wrap，
 * 与 UI 承诺的 Markdown 预览不符。统一抽取到这里，两边引用同一份实现。
 */
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Quote,
  Code,
  Link2,
  List,
  ListOrdered,
  Minus,
} from 'lucide-react';

export const MIN_TITLE_LENGTH = 5;
export const MIN_CONTENT_LENGTH = 100;

export type EditorMode = 'edit' | 'preview' | 'split';

/** Markdown 工具条（在两个编辑页中曾是逐字重复的实现） */
export const MarkdownToolbar = ({ onInsert }: { onInsert: (text: string) => void }) => {
  const tools = [
    { icon: Heading1, title: '标题 1', insert: '# ' },
    { icon: Heading2, title: '标题 2', insert: '## ' },
    { icon: Heading3, title: '标题 3', insert: '### ' },
    { icon: Bold, title: '粗体', insert: '****', cursorOffset: 2 },
    { icon: Italic, title: '斜体', insert: '**', cursorOffset: 1 },
    { icon: Quote, title: '引用', insert: '> ' },
    { icon: Code, title: '代码', insert: '``', cursorOffset: 1 },
    { icon: Link2, title: '链接', insert: '[](url)', cursorOffset: 1 },
    { icon: List, title: '无序列表', insert: '- ' },
    { icon: ListOrdered, title: '有序列表', insert: '1. ' },
    { icon: Minus, title: '分割线', insert: '\n---\n' },
  ];
  return (
    <div className="flex items-center gap-0.5 p-1 bg-background/30 rounded-lg border border-border/30">
      {tools.map((tool) => (
        <button
          key={tool.title}
          type="button"
          title={tool.title}
          aria-label={tool.title}
          onClick={() => onInsert(tool.insert)}
          className="p-2 rounded-md text-foreground/60 hover:text-foreground hover:bg-background/50 transition-colors"
        >
          <tool.icon className="w-4 h-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
};

/** 从 Markdown 正文生成纯文本摘要（截断 150 字） */
export const generateExcerpt = (content: string): string => {
  const plainText = content.replace(/[#*`_[\]]/g, '').trim();
  return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
};

interface ArticlePreviewProps {
  title: string;
  excerpt?: string;
  content: string;
}

/**
 * 文章预览：真正的 Markdown 渲染（GFM）。
 * 替代原先 whitespace-pre-wrap 的伪预览。
 */
export const ArticlePreview = ({ title, excerpt, content }: ArticlePreviewProps) => {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/80">
      <h1>{title || '未命名文章'}</h1>
      {excerpt && (
        <p className="text-lg text-foreground/60 border-l-4 border-tech-cyan pl-4 italic">
          {excerpt}
        </p>
      )}
      {content.trim() ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      ) : (
        <div className="whitespace-pre-wrap">暂无内容...</div>
      )}
    </div>
  );
};
