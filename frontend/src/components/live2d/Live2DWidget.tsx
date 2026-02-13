'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const MODEL_URL = '/wanko/runtime/wanko_touch.model3.json';
/** Cubism Core 由依赖 live2dcubismcore 提供，pnpm install 后会复制到 public，仅用本地 */
const CUBISM_CORE_SCRIPT = '/live2dcubismcore.min.js';
const CUBISM_CORE_TIMEOUT = 10000;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`加载失败: ${src}`));
    document.head.appendChild(script);
  });
}

function waitForCubismCore(): Promise<void> {
  return new Promise((resolve, reject) => {
    const win =
      typeof window !== 'undefined'
        ? (window as unknown as { Live2DCubismCore?: unknown })
        : null;
    if (win?.Live2DCubismCore) {
      resolve();
      return;
    }
    const deadline = Date.now() + CUBISM_CORE_TIMEOUT;
    const t = setInterval(() => {
      const w =
        typeof window !== 'undefined'
          ? (window as unknown as { Live2DCubismCore?: unknown })
          : null;
      if (w?.Live2DCubismCore) {
        clearInterval(t);
        resolve();
        return;
      }
      if (Date.now() > deadline) {
        clearInterval(t);
        reject(new Error('Cubism Core 未加载，请执行 pnpm install 后重试'));
      }
    }, 50);
  });
}

/** 加载本地 Cubism Core（来自依赖 live2dcubismcore，postinstall 已复制到 public） */
async function ensureCubismCore(): Promise<void> {
  const win =
    typeof window !== 'undefined'
      ? (window as unknown as { Live2DCubismCore?: unknown })
      : null;
  if (win?.Live2DCubismCore) return;

  await loadScript(CUBISM_CORE_SCRIPT);
  await waitForCubismCore();
}

export default function Live2DWidget() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>(
    'idle'
  );
  const [errorMessage, setErrorMessage] = useState<string>('');
  const mountedRef = useRef(true);
  const appRef = useRef<import('pixi.js').Application | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (pathname === '/login' || !containerRef.current) return;

    setStatus('loading');
    setErrorMessage('');

    const init = async () => {
      if (!containerRef.current || !mountedRef.current) return;

      try {
        await ensureCubismCore();
        if (!mountedRef.current || !containerRef.current) return;

        const PIXI = await import('pixi.js');
        (window as unknown as { PIXI: typeof PIXI }).PIXI = PIXI;

        const { Live2DModel } = await import('pixi-live2d-display/cubism4');
        if (!mountedRef.current || !containerRef.current) return;

        const view = document.createElement('canvas');
        view.style.width = '280px';
        view.style.height = '320px';
        view.style.pointerEvents = 'auto';
        view.style.display = 'block';
        canvasRef.current = view;
        containerRef.current.appendChild(view);

        const app = new PIXI.Application({
          view,
          width: 280,
          height: 320,
          backgroundAlpha: 0,
          antialias: true,
        });
        appRef.current = app;

        const model = await Live2DModel.from(MODEL_URL);
        if (!mountedRef.current) return;

        app.stage.addChild(model);
        model.anchor.set(0.5, 0.5);
        model.x = 40;
        model.y = 160;
        model.scale.set(0.2);

        model.on('hit', (hitAreas: string[]) => {
          if (hitAreas.length > 0) {
            model.motion('Tap');
          }
        });

        if (mountedRef.current) setStatus('ok');
      } catch (err) {
        if (appRef.current) {
          try {
            appRef.current.destroy(true, { children: true });
          } catch (_) {
            // ignore
          }
          appRef.current = null;
        }
        if (
          canvasRef.current &&
          containerRef.current?.contains(canvasRef.current)
        ) {
          containerRef.current.removeChild(canvasRef.current);
        }
        canvasRef.current = null;

        const msg = err instanceof Error ? err.message : String(err);
        const hint =
          msg.includes('404') ||
          msg.includes('Failed to fetch') ||
          msg.includes('Load')
            ? '（请确保 public/wanko/runtime 下有 .moc3 和贴图文件）'
            : '';
        setErrorMessage(msg + hint);
        if (mountedRef.current) setStatus('error');
        console.error('[Live2D] 加载失败:', err);
      }
    };

    init();

    return () => {
      if (appRef.current) {
        try {
          appRef.current.destroy(true, { children: true });
        } catch (_) {
          // ignore
        }
        appRef.current = null;
      }
      if (
        canvasRef.current &&
        containerRef.current?.contains(canvasRef.current)
      ) {
        containerRef.current.removeChild(canvasRef.current);
      }
      canvasRef.current = null;
    };
  }, [pathname]);

  if (pathname === '/login') return null;

  return (
    <div
      className="fixed z-[100] flex flex-col items-end justify-end pointer-events-none"
      style={{ width: 140, height: 160, right: 28, bottom: 88 }}
      aria-hidden
    >
      <div
        ref={containerRef}
        className="pointer-events-auto flex items-center justify-center overflow-hidden"
        style={{ width: 280, height: 320, minHeight: 320, background: 'transparent' }}
      >
        {status === 'loading' && (
          <span className="absolute text-xs text-muted-foreground">
            看板娘加载中…
          </span>
        )}
        {status === 'error' && (
          <span
            className="absolute text-xs text-destructive px-2 text-center"
            title={errorMessage}
          >
            看板娘加载失败
          </span>
        )}
      </div>
    </div>
  );
}
