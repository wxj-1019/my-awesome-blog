'use client';

import { Component, type ReactNode } from 'react';

interface ReadingErrorBoundaryProps {
  children: ReactNode;
}

interface ReadingErrorBoundaryState {
  hasError: boolean;
}

/**
 * 解读区渲染错误边界：AI 内容（Markdown 渲染等）崩溃时降级为提示，
 * 不影响页面其余部分。父组件通过 key 变化（如 aiState 切换）触发重置。
 */
export default class ReadingErrorBoundary extends Component<
  ReadingErrorBoundaryProps,
  ReadingErrorBoundaryState
> {
  state: ReadingErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ReadingErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <p className="mt-3 text-sm text-error">解读内容渲染失败，请重新尝试。</p>;
    }
    return this.props.children;
  }
}
