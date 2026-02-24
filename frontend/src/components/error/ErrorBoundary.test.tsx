import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import ErrorBoundary from '@/components/error/ErrorBoundary';

describe('ErrorBoundary', () => {
  const TestComponent = () => {
    const [shouldError, setShouldError] = useState(false);
    
    if (shouldError) {
      throw new Error('Test error');
    }
    
    return (
      <button onClick={() => setShouldError(true)}>
        Trigger Error
      </button>
    );
  };

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>正常内容</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('正常内容')).toBeInTheDocument();
  });

  it('shows error UI when child component throws', async () => {
    const user = userEvent.setup();
    
    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );
    
    await user.click(screen.getByText('Trigger Error'));
    
    expect(screen.getByText('出现了一些问题')).toBeInTheDocument();
    expect(screen.getByText('重试')).toBeInTheDocument();
  });

  it('allows retrying after error', async () => {
    const user = userEvent.setup();
    
    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );
    
    // 触发错误
    await user.click(screen.getByText('Trigger Error'));
    
    // 点击重试按钮
    await user.click(screen.getByText('重试'));
    
    // 应该回到正常状态
    expect(screen.getByText('Trigger Error')).toBeInTheDocument();
  });

  it('calls onError callback when provided', async () => {
    const onError = jest.fn();
    const user = userEvent.setup();
    
    render(
      <ErrorBoundary onError={onError}>
        <TestComponent />
      </ErrorBoundary>
    );
    
    await user.click(screen.getByText('Trigger Error'));
    
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('renders custom fallback when provided', async () => {
    const user = userEvent.setup();
    const customFallback = <div>自定义错误界面</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <TestComponent />
      </ErrorBoundary>
    );
    
    await user.click(screen.getByText('Trigger Error'));
    
    expect(screen.getByText('自定义错误界面')).toBeInTheDocument();
    expect(screen.queryByText('出现了一些问题')).not.toBeInTheDocument();
  });
});