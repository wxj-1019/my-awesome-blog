import { render } from '@testing-library/react';
import LoadingState from '@/components/ui/LoadingState';

// 捕获 LottieAnimation 的 props，避免真实加载 lottie-web
const lottieMock = jest.fn(
  (_props: { src?: unknown; staticOnReduceMotion?: boolean }) => (
    <div data-testid="lottie-animation" />
  )
);
jest.mock('@/components/ui/LottieAnimation', () => ({
  __esModule: true,
  default: (props: { src?: unknown; staticOnReduceMotion?: boolean }) =>
    lottieMock(props),
}));

describe('LoadingState', () => {
  beforeEach(() => {
    lottieMock.mockClear();
  });

  it('默认渲染 ripple 变体并加载本地声呐涟漪 Lottie', () => {
    const { getByTestId } = render(<LoadingState message="加载中..." />);

    expect(getByTestId('lottie-animation')).toBeInTheDocument();
    const props = lottieMock.mock.calls[0][0];
    expect(props.src).toBe('/lottie/ripple-sonar.json');
    // reduced-motion 时回退为静态帧而非完全隐藏
    expect(props.staticOnReduceMotion).toBe(true);
  });

  it('ripple 变体失败回退提供 CSS 静态圈', () => {
    render(<LoadingState variant="ripple" size="md" />);

    const props = lottieMock.mock.calls[0][0] as {
      fallback?: React.ReactElement;
    };
    expect(props.fallback).toBeTruthy();
  });

  it('旧变体 spinner/dots/pulse 仍然可用且不加载 Lottie', () => {
    render(
      <>
        <LoadingState variant="spinner" />
        <LoadingState variant="dots" />
        <LoadingState variant="pulse" />
      </>
    );

    expect(lottieMock).not.toHaveBeenCalled();
  });
});
