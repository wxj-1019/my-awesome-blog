'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getGenTaskStatus, type GenTaskStatusResponse } from '@/lib/api/imageGen';

/** 轮询生命周期状态 */
export type TaskPollStatus = 'idle' | 'polling' | 'success' | 'fail' | 'timeout' | 'error';

/** 轮询阶段（进度步进条用）：pending 排队 / running 生成 / done 成功 */
export type TaskPollPhase = 'idle' | 'pending' | 'running' | 'done';

interface UseTaskPollingOptions {
  /** 轮询间隔（ms），默认 3s */
  intervalMs?: number;
  /** 总超时（ms），默认 600s；RunningHub 视频任务较慢，放宽上限 */
  timeoutMs?: number;
  /** 单次轮询请求失败时，最多连续容忍次数（网络抖动），超出则置 error */
  maxRetries?: number;
}

export interface UseTaskPollingResult {
  status: TaskPollStatus;
  /** 轮询阶段（pending 排队 / running 生成 / done 成功；进度步进条用） */
  phase: TaskPollPhase;
  /** 最终成功结果（status=success 时非空） */
  result: GenTaskStatusResponse | null;
  /** 失败/超时/请求错误原因 */
  error: string | null;
  /** 开始轮询指定任务；已在轮询时调用会重置为新任务 */
  start: (taskId: string) => void;
  /** 主动停止（用户取消 / 组件卸载） */
  stop: () => void;
}

/**
 * 生成任务轮询 hook：start(taskId) 后按固定间隔查询状态，
 * success/fail 立即结束；timeout/连续错误置对应状态；卸载自动清理。
 */
export function useTaskPolling({
  intervalMs = 3000,
  timeoutMs = 600000,
  maxRetries = 3,
}: UseTaskPollingOptions = {}): UseTaskPollingResult {
  const [status, setStatus] = useState<TaskPollStatus>('idle');
  const [phase, setPhase] = useState<TaskPollPhase>('idle');
  const [result, setResult] = useState<GenTaskStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 用 ref 保存最新回调与配置，避免轮询闭包持有过期值
  const intervalRef = useRef(intervalMs);
  const timeoutRef = useRef(timeoutMs);
  const maxRetriesRef = useRef(maxRetries);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taskIdRef = useRef<string | null>(null);

  intervalRef.current = intervalMs;
  timeoutRef.current = timeoutMs;
  maxRetriesRef.current = maxRetries;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    setPhase('idle');
    taskIdRef.current = null;
  }, [clearTimer]);

  // 卸载清理，避免 setState on unmounted
  useEffect(() => stop, [stop]);

  const start = useCallback(
    (taskId: string) => {
      clearTimer();
      setPhase('pending');
      taskIdRef.current = taskId;
      setStatus('polling');
      setResult(null);
      setError(null);

      const startedAt = Date.now();
      let retryCount = 0;

      const pollOnce = async (): Promise<void> => {
        if (taskIdRef.current !== taskId) {
          return; // 已被 stop / 新一轮 start 接管
        }
        try {
          const data = await getGenTaskStatus(taskId);
          if (taskIdRef.current !== taskId) {
            return;
          }
          retryCount = 0; // 成功即重置连续错误计数

          if (data.status === 'running') {
            setPhase('running');
          }
          if (data.status === 'success') {
            setResult(data);
            setPhase('done');
            setStatus('success');
            clearTimer();
            return;
          }
          if (data.status === 'fail') {
            setError(data.fail_reason ?? '任务失败，请重试');
            setStatus('fail');
            clearTimer();
            return;
          }
          // pending / running：继续轮询
          scheduleNext();
        } catch (err) {
          if (taskIdRef.current !== taskId) {
            return;
          }
          retryCount += 1;
          if (retryCount > maxRetriesRef.current) {
            const message =
              err instanceof Error ? err.message : '查询生成状态失败，请重试';
            setError(message);
            setStatus('error');
            clearTimer();
            return;
          }
          scheduleNext(); // 网络抖动：容忍并继续
        }
      };

      const scheduleNext = (): void => {
        const elapsed = Date.now() - startedAt;
        if (elapsed >= timeoutRef.current) {
          setError('生成超时，请稍后到生成记录中查看');
          setStatus('timeout');
          return;
        }
        timerRef.current = setTimeout(() => {
          void pollOnce();
        }, intervalRef.current);
      };

      void pollOnce(); // 立即查一次，避免首个结果多等一个间隔
    },
    [clearTimer]
  );

  return { status, phase, result, error, start, stop };
}
