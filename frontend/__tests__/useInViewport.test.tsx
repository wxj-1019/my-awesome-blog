import { render } from '@testing-library/react';
import { useRef } from 'react';
import { useInViewport } from '@/hooks/useInViewport';

/** 测试用包装组件：把 hook 结果写到外部变量 */
function Probe({ onResult }: { onResult: (v: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inViewport = useInViewport(ref);
  onResult(inViewport);
  return <div ref={ref} />;
}

describe('useInViewport · 视口检测 hook', () => {
  it('IntersectionObserver 不可用时降级为始终可见', () => {
    const original = globalThis.IntersectionObserver;
    // @ts-expect-error 故意置空模拟旧环境
    delete globalThis.IntersectionObserver;

    let result = false;
    render(<Probe onResult={(v) => { result = v; }} />);
    expect(result).toBe(true);

    globalThis.IntersectionObserver = original;
  });

  it('IntersectionObserver 可用时会 observe 与 disconnect', () => {
    const observe = jest.fn();
    const disconnect = jest.fn();
    const unobserve = jest.fn();
    const instances: unknown[] = [];
    // 测试桩：只需 observe/disconnect 调用证据，完整 IO 类型无关
    class FakeIO {
      constructor() {
        instances.push(this);
      }
      observe = observe;
      disconnect = disconnect;
      unobserve = unobserve;
      takeRecords = jest.fn();
    }
    const original = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver;

    const { unmount } = render(<Probe onResult={() => {}} />);
    expect(observe).toHaveBeenCalled();
    expect(instances).toHaveLength(1);

    unmount();
    expect(disconnect).toHaveBeenCalled();

    globalThis.IntersectionObserver = original;
  });
});
