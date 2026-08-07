import { act, renderHook } from '@testing-library/react';
import { useTaskPolling } from '@/hooks/useTaskPolling';
import { getGenTaskStatus } from '@/lib/api/imageGen';

jest.mock('@/lib/api/imageGen', () => ({
  getGenTaskStatus: jest.fn(),
}));

const mockGetStatus = getGenTaskStatus as jest.Mock;

/** 便捷构造状态响应 */
const statusResp = (overrides: Record<string, unknown> = {}) => ({
  task_id: 'task-1',
  status: 'running',
  images: [],
  video_url: null,
  fail_reason: null,
  ...overrides,
});

describe('useTaskPolling · 生成任务轮询 hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockGetStatus.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('初始为 idle，start 后立即查询一次并置 polling', async () => {
    mockGetStatus.mockResolvedValue(statusResp());
    const { result } = renderHook(() => useTaskPolling({ intervalMs: 3000 }));

    expect(result.current.status).toBe('idle');

    act(() => {
      result.current.start('task-1');
    });
    expect(result.current.status).toBe('polling');
    // 立即查询（无需等间隔）
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockGetStatus).toHaveBeenCalledWith('task-1');
  });

  it('running 状态按间隔继续轮询，success 后停止并回填结果', async () => {
    mockGetStatus
      .mockResolvedValueOnce(statusResp()) // 第一次 running
      .mockResolvedValueOnce(statusResp({ status: 'success', images: ['https://cdn/x.png'] }));
    const { result } = renderHook(() => useTaskPolling({ intervalMs: 3000 }));

    act(() => {
      result.current.start('task-1');
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.status).toBe('polling');
    expect(mockGetStatus).toHaveBeenCalledTimes(1);

    // 快进一个间隔 → 第二次查询 → success
    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
    });
    expect(mockGetStatus).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('success');
    expect(result.current.result?.images).toEqual(['https://cdn/x.png']);

    // success 后不再轮询
    await act(async () => {
      jest.advanceTimersByTime(9000);
      await Promise.resolve();
    });
    expect(mockGetStatus).toHaveBeenCalledTimes(2);
  });

  it('fail 状态停止轮询并携带失败原因', async () => {
    mockGetStatus.mockResolvedValue(statusResp({ status: 'fail', fail_reason: '审核未通过' }));
    const { result } = renderHook(() => useTaskPolling({ intervalMs: 3000 }));

    act(() => {
      result.current.start('task-1');
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.status).toBe('fail');
    expect(result.current.error).toBe('审核未通过');
    expect(mockGetStatus).toHaveBeenCalledTimes(1);
  });

  it('phase 跟随轮询阶段：pending → running → done', async () => {
    mockGetStatus
      .mockResolvedValueOnce(statusResp({ status: 'pending' })) // 第一次 pending
      .mockResolvedValueOnce(statusResp({ status: 'running' })) // 第二次 running
      .mockResolvedValueOnce(statusResp({ status: 'success', images: ['https://cdn/x.png'] }));
    const { result } = renderHook(() => useTaskPolling({ intervalMs: 3000 }));

    expect(result.current.phase).toBe('idle');

    act(() => {
      result.current.start('task-1');
    });
    expect(result.current.phase).toBe('pending');
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.phase).toBe('pending'); // 首查 pending

    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
    });
    expect(result.current.phase).toBe('running'); // 二查 running

    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
    });
    expect(result.current.phase).toBe('done'); // 三查 success
    expect(result.current.status).toBe('success');
  });

  it('stop 后 phase 回到 idle', async () => {
    mockGetStatus.mockResolvedValue(statusResp());
    const { result } = renderHook(() => useTaskPolling({ intervalMs: 3000 }));

    act(() => {
      result.current.start('task-1');
    });
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      result.current.stop();
    });
    expect(result.current.phase).toBe('idle');
  });

  it('超出总超时置 timeout', async () => {
    mockGetStatus.mockResolvedValue(statusResp());
    const { result } = renderHook(() =>
      useTaskPolling({ intervalMs: 3000, timeoutMs: 10000 })
    );

    act(() => {
      result.current.start('task-1');
    });
    await act(async () => {
      await Promise.resolve();
    });
    // 快进超过超时阈值（10s → 12s 共 4 次查询后超时）
    await act(async () => {
      jest.advanceTimersByTime(12000);
      await Promise.resolve();
    });
    expect(result.current.status).toBe('timeout');
    expect(result.current.error).toContain('超时');
  });

  it('连续请求错误超过容忍次数置 error 并停止', async () => {
    mockGetStatus.mockRejectedValue(new Error('网络错误'));
    const { result } = renderHook(() => useTaskPolling({ intervalMs: 3000, maxRetries: 2 }));

    act(() => {
      result.current.start('task-1');
    });
    // 第 1 次（立即）+ 第 2、3 次（间隔）：共 3 次失败 > maxRetries 2
    await act(async () => {
      await Promise.resolve();
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('网络错误');
  });

  it('stop 终止轮询，状态回 idle 语义由调用方接管', async () => {
    mockGetStatus.mockResolvedValue(statusResp());
    const { result } = renderHook(() => useTaskPolling({ intervalMs: 3000 }));

    act(() => {
      result.current.start('task-1');
    });
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      result.current.stop();
    });
    const callsAfterStop = mockGetStatus.mock.calls.length;
    await act(async () => {
      jest.advanceTimersByTime(9000);
      await Promise.resolve();
    });
    // stop 后不再发起新查询
    expect(mockGetStatus.mock.calls.length).toBe(callsAfterStop);
  });

  it('卸载时清理定时器（不触发 setState on unmounted）', async () => {
    mockGetStatus.mockResolvedValue(statusResp());
    const { result, unmount } = renderHook(() => useTaskPolling({ intervalMs: 3000 }));

    act(() => {
      result.current.start('task-1');
    });
    await act(async () => {
      await Promise.resolve();
    });
    // 卸载后快进时间，不应抛错/警告
    unmount();
    await act(async () => {
      jest.advanceTimersByTime(6000);
      await Promise.resolve();
    });
    // 卸载即 stop：清理定时器，不再查询
    expect(mockGetStatus.mock.calls.length).toBe(1);
  });
});
