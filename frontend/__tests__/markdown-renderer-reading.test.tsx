import type { ComponentType, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

interface MarkdownComponentProps {
  children?: ReactNode;
  className?: string;
  inline?: boolean;
}

interface ReactMarkdownMockProps {
  children: string;
  components: Record<string, ComponentType<MarkdownComponentProps>>;
}

// react-markdown v10 及其解析链为纯 ESM，当前 CommonJS ts-jest 无法直接加载。
// 此适配器只从传入 Markdown 提取本文件验证的语义块，最终渲染仍使用组件映射。
jest.mock('react-markdown', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  return {
    __esModule: true,
    default: ({ children, components }: ReactMarkdownMockProps) => {
      const headingNodes = Array.from(
        children.matchAll(/^(#{1,6})\s+(.+)$/gm),
        ([, marks, text], index) => {
          const Heading = components[`h${marks.length}`];
          return React.createElement(
            Heading,
            { key: `heading-${index}` },
            text
          );
        }
      );

      const quoteMatch = /^>\s?(.+)$/m.exec(children);
      const Quote = components.blockquote;
      const quoteNode = quoteMatch
        ? React.createElement(
            Quote,
            { key: 'quote' },
            React.createElement('p', null, quoteMatch[1])
          )
        : null;

      const codeMatch = /```([^\s]*)\s*\n([\s\S]*?)\n```/.exec(children);
      const Code = components.code;
      const codeNode = codeMatch
        ? React.createElement(
            Code,
            {
              className: codeMatch[1] ? `language-${codeMatch[1]}` : undefined,
              inline: false,
              key: 'code',
            },
            `${codeMatch[2]}\n`
          )
        : null;

      const tableLines = children
        .split(/\r?\n/)
        .filter(line => line.trim().startsWith('|'));
      const Table = components.table;
      const tableNode =
        tableLines.length >= 3
          ? React.createElement(
              Table,
              { key: 'table' },
              React.createElement(
                'tbody',
                null,
                React.createElement('tr', null)
              )
            )
          : null;

      return React.createElement(
        React.Fragment,
        null,
        ...headingNodes,
        quoteNode,
        codeNode,
        tableNode
      );
    },
  };
});

jest.mock('remark-gfm', () => ({ __esModule: true, default: () => undefined }));
jest.mock('rehype-raw', () => ({ __esModule: true, default: () => undefined }));
jest.mock('rehype-sanitize', () => ({
  __esModule: true,
  default: () => undefined,
}));

const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  'clipboard'
);
const writeText = jest.fn<Promise<void>, [string]>(() => Promise.resolve());

const markdown = `
# 文内一级标题

第一段正文。

## 第二章

> 一段中文引用。

\`\`\`ts
const answer = 42;
\`\`\`

| 列一 | 列二 |
| --- | --- |
| A | B |
`;

beforeAll(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    writable: true,
    configurable: true,
  });
});

beforeEach(() => {
  writeText.mockClear();
});

afterAll(() => {
  if (originalClipboardDescriptor) {
    Object.defineProperty(navigator, 'clipboard', originalClipboardDescriptor);
    return;
  }

  Reflect.deleteProperty(navigator, 'clipboard');
});

function renderArticleMarkdown() {
  return render(<MarkdownRenderer content={markdown} context="article" />);
}

describe('MarkdownRenderer · 文章阅读语义', () => {
  it('把 Markdown h1 降级为 h2，保持页面唯一 h1', () => {
    renderArticleMarkdown();

    expect(
      screen.queryByRole('heading', { level: 1, name: '文内一级标题' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: '文内一级标题' })
    ).toBeInTheDocument();
  });

  it('代码复制按钮有可访问名称并调用 clipboard', () => {
    renderArticleMarkdown();

    fireEvent.click(
      screen.getByRole('button', { name: '复制 TypeScript 代码' })
    );
    expect(writeText).toHaveBeenCalledWith('const answer = 42;');
  });

  it('引用使用文章阅读语义 class', () => {
    const { container } = renderArticleMarkdown();

    expect(container.querySelector('blockquote')).toHaveClass(
      'article-reading-quote'
    );
  });

  it('表格使用文章阅读语义 class', () => {
    const { container } = renderArticleMarkdown();

    expect(container.querySelector('table')).toHaveClass(
      'article-reading-table'
    );
  });
});
