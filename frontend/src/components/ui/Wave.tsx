'use client';

interface WaveProps {
  position?: 'top' | 'bottom';
  className?: string;
}

/**
 * 页脚/区块波浪装饰。
 * 填充色使用 CSS 变量 --wave-fill（在 variables.css 中按 light/dark 定义）。
 */
export default function Wave({ position = 'bottom', className = '' }: WaveProps) {
  return (
    <div
      className={`absolute w-full overflow-hidden leading-none ${position === 'top' ? 'top-0' : 'bottom-0'} ${className}`}
    >
      <svg
        className="relative block w-full h-full"
        data-name="Layer 1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--wave-fill-from)" />
            <stop offset="100%" stopColor="var(--wave-fill-to)" />
          </linearGradient>
        </defs>
        <path
          d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
          style={{ fill: 'url(#waveGradient)' }}
        />
      </svg>
    </div>
  );
}
