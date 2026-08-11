'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { cn } from '@/lib/utils';
import { extractMarkdownHeadings } from '@/utils/markdown-headings';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('python', python);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);

/** 代码语言标签映射，用于 aria-label 和显示 */
const LANGUAGE_LABEL_MAP: Record<string, string> = {
  ts: 'TypeScript',
  typescript: 'TypeScript',
  js: 'JavaScript',
  javascript: 'JavaScript',
  py: 'Python',
  python: 'Python',
  bash: 'bash',
  shell: 'bash',
  css: 'CSS',
  html: 'HTML',
  json: 'JSON',
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
  maxHeight?: string | number;
  showFull?: boolean;
  allowedElements?: string[];
  context?: 'default' | 'article';
}

export default function MarkdownRenderer({
  content,
  className,
  maxHeight,
  showFull = false,
  allowedElements = [
    'p',
    'br',
    'strong',
    'em',
    'code',
    'pre',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'hr',
    'del',
    'ins',
    'sub',
    'sup',
  ],
  context = 'default',
}: MarkdownRendererProps) {
  const headings = useMemo(() => extractMarkdownHeadings(content), [content]);

  const isArticle = context === 'article';

  // 处理空内容
  if (!content || content.trim() === '') {
    return (
      <div
        className={cn(
          isArticle ? 'text-muted-foreground' : 'text-muted-foreground/60',
          'text-sm italic',
          className
        )}
      >
        暂无内容
      </div>
    );
  }

  // 定义组件类型
  interface ComponentProps {
    node?: unknown;
    className?: string;
    children?: React.ReactNode;
    [key: string]: unknown;
  }

  interface CodeProps extends ComponentProps {
    inline?: boolean;
  }

  interface LinkProps extends ComponentProps {
    href?: string;
    title?: string;
  }

  interface ImageProps extends ComponentProps {
    src?: string;
    alt?: string;
    title?: string;
  }

  let headingIndex = 0;

  const components = {
    // 标题 ID 与目录解析共享同一规则，确保锚点稳定且重复标题不冲突
    // 文章阅读模式下 h1 降级为 h2，保持页面唯一 h1
    h1({ _node, children, ...props }: ComponentProps) {
      const heading = headings[headingIndex++];
      if (isArticle) {
        return (
          <h2 id={heading?.id} className="scroll-mt-24" {...props}>
            {children}
          </h2>
        );
      }
      return (
        <h1 id={heading?.id} className="scroll-mt-24" {...props}>
          {children}
        </h1>
      );
    },
    h2({ _node, children, ...props }: ComponentProps) {
      const heading = headings[headingIndex++];
      return (
        <h2 id={heading?.id} className="scroll-mt-24" {...props}>
          {children}
        </h2>
      );
    },
    h3({ _node, children, ...props }: ComponentProps) {
      const heading = headings[headingIndex++];
      return (
        <h3 id={heading?.id} className="scroll-mt-24" {...props}>
          {children}
        </h3>
      );
    },
    h4({ _node, children, ...props }: ComponentProps) {
      const heading = headings[headingIndex++];
      return (
        <h4 id={heading?.id} className="scroll-mt-24" {...props}>
          {children}
        </h4>
      );
    },
    h5({ _node, children, ...props }: ComponentProps) {
      const heading = headings[headingIndex++];
      return (
        <h5 id={heading?.id} className="scroll-mt-24" {...props}>
          {children}
        </h5>
      );
    },
    h6({ _node, children, ...props }: ComponentProps) {
      const heading = headings[headingIndex++];
      return (
        <h6 id={heading?.id} className="scroll-mt-24" {...props}>
          {children}
        </h6>
      );
    },

    // 代码块
    code({ _node, inline, className, children, ...props }: CodeProps) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeContent = String(children).replace(/\n$/, '');

      if (!inline && language) {
        const highlighted = hljs.getLanguage(language)
          ? hljs.highlight(codeContent, { language }).value
          : hljs.highlightAuto(codeContent).value;

        const languageLabel = LANGUAGE_LABEL_MAP[language] || language;

        return (
          <div className="relative my-3 rounded-lg overflow-hidden border border-border/60 code-enhanced">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/60 border-b border-border/60">
              <span className="text-xs font-mono text-muted-foreground/60">
                {language}
              </span>
              <button
                type="button"
                aria-label={
                  languageLabel ? `复制 ${languageLabel} 代码` : '复制代码'
                }
                className="text-xs text-primary hover:text-primary/80 transition-colors"
                onClick={() => navigator.clipboard.writeText(codeContent)}
              >
                复制
              </button>
            </div>
            <pre className="hljs m-0 p-4 overflow-x-auto bg-muted/40 font-mono text-sm">
              <code
                className={`language-${language}`}
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </pre>
          </div>
        );
      }

      return (
        <code
          className={cn(
            'px-1.5 py-0.5 rounded bg-muted/60 text-primary font-mono text-sm',
            className
          )}
          {...props}
        >
          {children}
        </code>
      );
    },

    // 链接 - 添加外部链接标识和安全检查
    a({ _node, href, title, children, ...props }: LinkProps) {
      const isExternal = href?.startsWith('http');
      return (
        <a
          href={href}
          title={title}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-primary hover:text-primary/80 underline transition-colors"
          {...props}
        >
          {children}
          {isExternal && <span className="ml-1 text-xs opacity-60">↗</span>}
        </a>
      );
    },

    // 图片 - Markdown 中的图片地址来自用户输入，可能为任意外部域名，保留 <img>
    img({ _node, src, alt, title, ...props }: ImageProps) {
      return (
        <img
          src={src}
          alt={alt || '图片'}
          title={title}
          loading="lazy"
          className="max-w-full h-auto rounded-lg my-3 border border-border/60"
          onError={e => {
            e.currentTarget.src = '/placeholder-image.svg';
            e.currentTarget.alt = '图片加载失败';
          }}
          {...props}
        />
      );
    },

    // 引用块
    blockquote({ _node, children, ...props }: ComponentProps) {
      return (
        <blockquote
          className={cn(
            'border-l-4 border-primary/50 pl-4 py-2 my-3 bg-primary/5 rounded-r-lg',
            isArticle && 'article-reading-quote'
          )}
          {...props}
        >
          {children}
        </blockquote>
      );
    },

    // 表格
    table({ _node, children, ...props }: ComponentProps) {
      return (
        <div className="overflow-x-auto my-4">
          <table
            className={cn(
              'min-w-full divide-y divide-border/60 border border-border/60 rounded-lg',
              isArticle && 'article-reading-table'
            )}
            {...props}
          >
            {children}
          </table>
        </div>
      );
    },

    th({ _node, children, ...props }: ComponentProps) {
      return (
        <th
          className="px-4 py-3 text-left text-sm font-semibold text-foreground bg-muted/60"
          {...props}
        >
          {children}
        </th>
      );
    },

    td({ _node, children, ...props }: ComponentProps) {
      return (
        <td
          className="px-4 py-3 text-sm text-muted-foreground border-t border-border/60"
          {...props}
        >
          {children}
        </td>
      );
    },

    // 水平线
    hr({ _node, ...props }: ComponentProps) {
      return <hr className="my-6 border-border/60" {...props} />;
    },
  };

  return (
    <div
      className={cn(
        'markdown-content prose prose-invert max-w-none',
        'prose-headings:text-foreground prose-headings:font-syne',
        'prose-p:text-foreground/85 prose-p:leading-relaxed',
        'prose-strong:text-foreground prose-strong:font-bold',
        'prose-em:text-foreground/80 prose-em:italic',
        'prose-code:text-primary prose-code:font-mono',
        'prose-pre:bg-muted/40 prose-pre:border prose-pre:border-border/60',
        'prose-blockquote:border-primary/50 prose-blockquote:text-muted-foreground',
        'prose-ul:marker:text-muted-foreground prose-ol:marker:text-muted-foreground',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:text-primary/80',
        'prose-table:divide-border/60 prose-th:bg-muted/60',
        'prose-img:rounded-lg prose-img:border prose-img:border-border/60',
        'dark:prose-invert',
        isArticle && 'article-markdown',
        className
      )}
      style={
        maxHeight && !showFull
          ? {
              maxHeight,
              overflow: 'hidden',
              position: 'relative',
            }
          : undefined
      }
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={components as never}
        allowedElements={allowedElements}
        unwrapDisallowed
      >
        {content}
      </ReactMarkdown>

      {/* 如果内容被截断，显示查看更多按钮 */}
      {maxHeight && !showFull && (
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent flex items-end justify-center pb-2">
          <button className="text-xs text-primary hover:text-primary/80 transition-colors font-mono">
            查看完整内容
          </button>
        </div>
      )}
    </div>
  );
}
