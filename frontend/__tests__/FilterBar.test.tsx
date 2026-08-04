import { render, screen, fireEvent } from '@testing-library/react';
import FilterBar from '@/components/articles/FilterBar';

function setup(overrides: Partial<Parameters<typeof FilterBar>[0]> = {}) {
  const props = {
    onSearchChange: jest.fn(),
    viewMode: 'grid' as const,
    onViewToggle: jest.fn(),
    onOpenDrawer: jest.fn(),
    ...overrides,
  };
  render(<FilterBar {...props} />);
  return props;
}

describe('FilterBar · 文章页筛选栏', () => {
  it('渲染搜索框、视图切换与归档入口', () => {
    setup();

    expect(screen.getByLabelText('搜索文章')).toBeInTheDocument();
    expect(screen.getByLabelText('网格视图')).toBeInTheDocument();
    expect(screen.getByLabelText('列表视图')).toBeInTheDocument();
    expect(screen.getByLabelText('打开归档抽屉')).toBeInTheDocument();
  });

  it('输入搜索内容后经防抖触发搜索回调', () => {
    jest.useFakeTimers();
    const props = setup();

    fireEvent.change(screen.getByLabelText('搜索文章'), {
      target: { value: 'React' },
    });
    expect(props.onSearchChange).not.toHaveBeenCalled();

    jest.advanceTimersByTime(350);
    expect(props.onSearchChange).toHaveBeenCalledWith('React');
    jest.useRealTimers();
  });

  it('清空按钮重置输入并触发空搜索', () => {
    jest.useFakeTimers();
    const props = setup();

    fireEvent.change(screen.getByLabelText('搜索文章'), {
      target: { value: 'React' },
    });
    fireEvent.click(screen.getByLabelText('清空搜索'));
    jest.advanceTimersByTime(350);
    expect(props.onSearchChange).toHaveBeenLastCalledWith('');
    jest.useRealTimers();
  });

  it('切换视图与打开归档分别触发对应回调', () => {
    const props = setup();

    fireEvent.click(screen.getByLabelText('列表视图'));
    expect(props.onViewToggle).toHaveBeenCalledWith('list');

    fireEvent.click(screen.getByLabelText('打开归档抽屉'));
    expect(props.onOpenDrawer).toHaveBeenCalled();
  });
});
