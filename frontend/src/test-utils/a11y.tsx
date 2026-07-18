import { render, RenderOptions } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ReactElement } from 'react';

/**
 * 渲染组件并运行 axe 无障碍扫描。
 * @param ui 待测 React 元素
 * @param options @testing-library/react 渲染选项
 * @returns axe 扫描结果，断言时可直接使用 toHaveNoViolations
 */
export async function runA11yScan(
  ui: ReactElement,
  options?: RenderOptions
) {
  const { container } = render(ui, options);
  const results = await axe(container);
  return results;
}

/**
 * 断言组件不存在可访问性违规。
 * @param ui 待测 React 元素
 * @param options @testing-library/react 渲染选项
 */
export async function expectNoA11yViolations(
  ui: ReactElement,
  options?: RenderOptions
) {
  const results = await runA11yScan(ui, options);
  expect(results).toHaveNoViolations();
}
