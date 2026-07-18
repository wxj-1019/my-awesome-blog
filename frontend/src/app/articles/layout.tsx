'use client';

import { LayoutGroup } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * 文章列表 ↔ 详情 共享 layoutId 过渡的父级 LayoutGroup。
 */
export default function ArticlesLayout({ children }: { children: ReactNode }) {
  return <LayoutGroup id="articles-shared">{children}</LayoutGroup>;
}
