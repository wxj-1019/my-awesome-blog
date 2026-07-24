import { createStarfield } from '@/lib/starfield';

/** 最小 canvas + 2d context mock，记录被调用的方法 */
function mockCanvas() {
  const calls: string[] = [];
  const ctx: any = {
    set fillStyle(v: string) { calls.push(`fillStyle:${v}`); },
    get fillStyle() { return ''; },
    set strokeStyle(v: string) { calls.push(`strokeStyle:${v}`); },
    get strokeStyle() { return ''; },
    set lineWidth(v: number) { calls.push(`lineWidth:${v}`); },
    get lineWidth() { return 1; },
    set globalCompositeOperation(v: string) { calls.push(`comp:${v}`); },
    get globalCompositeOperation() { return 'source-over'; },
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    fillRect: (...a: unknown[]) => calls.push(`fillRect:${a.length}`),
    beginPath: () => calls.push('beginPath'),
    arc: (...a: unknown[]) => calls.push(`arc:${a.length}`),
    fill: () => calls.push('fill'),
    stroke: () => calls.push('stroke'),
    moveTo: () => calls.push('moveTo'),
    lineTo: () => calls.push('lineTo'),
    save: () => calls.push('save'),
    restore: () => calls.push('restore'),
    setTransform: () => calls.push('setTransform'),
    clearRect: () => calls.push('clearRect'),
  };
  const canvas: any = {
    width: 800, height: 600,
    getBoundingClientRect: () => ({ width: 800, height: 600, left: 0, top: 0 }),
    getContext: () => ctx,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  return { canvas, ctx, calls };
}

describe('createStarfield', () => {
  beforeAll(() => {
    // jsdom 无 ResizeObserver / requestAnimationFrame / devicePixelRatio
    (globalThis as any).ResizeObserver = class {
      observe() {} unobserve() {} disconnect() {}
    };
    (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) =>
      0 as unknown as number;
    (globalThis as any).cancelAnimationFrame = () => {};
    (globalThis as any).devicePixelRatio = 1;
  });

  it('返回 start/stop/resize/drawStatic 控制接口', () => {
    const { canvas } = mockCanvas();
    const sf = createStarfield(canvas);
    expect(typeof sf.start).toBe('function');
    expect(typeof sf.stop).toBe('function');
    expect(typeof sf.resize).toBe('function');
    expect(typeof sf.drawStatic).toBe('function');
  });

  it('start 与 stop 幂等，不抛错', () => {
    const { canvas } = mockCanvas();
    const sf = createStarfield(canvas);
    expect(() => { sf.start(); sf.start(); sf.stop(); sf.stop(); }).not.toThrow();
  });

  it('drawStatic 绘制底色与星点（调用 fillRect 与 arc）', () => {
    const { canvas, calls } = mockCanvas();
    const sf = createStarfield(canvas);
    sf.drawStatic();
    expect(calls).toContain('fillRect:4');
    expect(calls.filter((c) => c.startsWith('arc:')).length).toBeGreaterThan(0);
  });
});
