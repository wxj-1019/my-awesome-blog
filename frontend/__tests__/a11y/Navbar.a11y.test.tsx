import React from 'react';
import Navbar from '@/components/navigation/Navbar';
import { expectNoA11yViolations } from '@/test-utils/a11y';

jest.mock('next/link', () => {
  return function MockedLink({ children, href, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
    return <a href={href} {...rest}>{children}</a>;
  };
});

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}));

jest.mock('@/components/ui/rope-theme-toggler', () => ({
  RopeThemeToggler: () => <button type="button">主题切换</button>,
}));

jest.mock('@/components/navigation/UserProfileMenu', () => ({
  __esModule: true,
  default: () => <button type="button">用户</button>,
}));

describe('Navbar 无障碍', () => {
  it('默认导航栏应无严重可访问性违规', async () => {
    await expectNoA11yViolations(<Navbar />);
  });
});
