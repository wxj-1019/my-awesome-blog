import type { ComponentType, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

interface MarkdownComponentProps {
  children?: ReactNode;
  className?: string;
  inline?: boolean;
}

interface ReactMarkdownMockProps {
  components: Record<string, ComponentType<MarkdownComponentProps>>;
}

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ components }: ReactMarkdownMockProps) => {
    const HeadingOne = components.h1;
    const HeadingTwo = components.h2;
    const Quote = components.blockquote;
    const Code = components.code;
    const Table = components.table;

    return (
      <>
        <HeadingOne>文内一级标题</HeadingOne>
        <p>第一段正文。</p>
        <HeadingTwo>第二章</HeadingTwo>
        <Quote>
          <p>一段中文引用。</p>
        </Quote>
        <Code inline={false} className="language-ts">
          {'const answer = 42;\n'}
        </Code>
        <Table>
          <tbody>
            <tr>
              <td>A</td>
              <td>B</td>
            </tr>
          </tbody>
        </Table>
      </>
    );
  },
}));

jest.mock('remark-gfm', () => ({ __esModule: true, default: () => undefined }));
jest.mock('rehype-raw', () => ({ __esModule: true, default: () => undefined }));
jest.mock('rehype-sanitize', () => ({
  __esModule: true,
  default: () => undefined,
}));

const writeText = jest.fn<Promise<void>, [string]>(() => Promise.resolve());

Object.defineProperty(navigator, 'clipboard', {
  value: { writeText },
  writable: true,
  configurable: true,
});

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

beforeEach(() => {
  writeText.mockClear();
});

describe('MarkdownRenderer · 文章阅读语义', () => {
  it('把 Markdown h1 降级为 h2，保持页面唯一 h1', () => {
    render(<MarkdownRenderer content={markdown} context="article" />);

    expect(
      screen.queryByRole('heading', { level: 1, name: '文内一级标题' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: '文内一级标题' })
    ).toBeInTheDocument();
  });

  it('代码复制按钮有可访问名称并调用 clipboard', () => {
    render(<MarkdownRenderer content={markdown} context="article" />);

    fireEvent.click(
      screen.getByRole('button', { name: '复制 TypeScript 代码' })
    );
    expect(writeText).toHaveBeenCalledWith('const answer = 42;');
  });

  it('引用与表格使用文章阅读语义 class', () => {
    const { container } = render(
      <MarkdownRenderer content={markdown} context="article" />
    );

    expect(container.querySelector('blockquote')).toHaveClass(
      'article-reading-quote'
    );
    expect(container.querySelector('table')).toHaveClass(
      'article-reading-table'
    );
  });
});
