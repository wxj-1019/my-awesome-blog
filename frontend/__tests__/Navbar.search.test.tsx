import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '@/components/navigation/Navbar';

jest.mock('next/link', () => {
  return function MockedLink({
    children,
    href,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  };
});

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/components/ui/rope-theme-toggler', () => ({
  RopeThemeToggler: () => <button type="button">主题切换</button>,
}));

jest.mock('@/components/navigation/UserProfileMenu', () => ({
  __esModule: true,
  default: () => <button type="button">用户</button>,
}));

// GlobalSearch 真实渲染：mock 搜索 API，避免 jsdom 发起真实请求
jest.mock('@/lib/api/search', () => ({
  searchArticlesFulltext: jest.fn(),
}));

/** 断言搜索弹窗已打开：combobox 输入框 + dialog 容器同时出现 */
function expectSearchDialogOpen() {
  // 移动端菜单按钮 aria-label 同为「搜索文章」，用 combobox 角色精确匹配输入框
  expect(
    screen.getByRole('combobox', { name: '搜索文章' })
  ).toBeInTheDocument();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
}

describe('Navbar · 搜索入口集成', () => {
  it('点击导航搜索按钮后 GlobalSearch 弹窗打开', () => {
    render(<Navbar />);
    fireEvent.click(
      screen.getByRole('button', { name: '搜索 (Cmd/Ctrl + K)' })
    );
    expectSearchDialogOpen();
  });

  it('Cmd+K keydown 同样打开搜索弹窗', () => {
    render(<Navbar />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expectSearchDialogOpen();
  });

  it('Ctrl+K keydown 同样打开搜索弹窗', () => {
    render(<Navbar />);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expectSearchDialogOpen();
  });
});
