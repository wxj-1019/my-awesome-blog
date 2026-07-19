interface WaveStackProps {
  className?: string;
  /** 层数（默认 3）；建议 2–4 */
  waveCount?: number;
}

/**
 * 双幅平移循环波浪：每层 path 画两个完整周期（viewBox 宽 2400），
 * 通过 translateX(0 → -50%) 线性无限循环实现真正「流动」的水波，
 * 无形变、无跳变。三层在周期/振幅/速度/透明度上错开，形成层次。
 *
 * 颜色取自 CSS 变量 --wave-fill-from / --wave-fill-to（按 light/dark 定义）。
 */
export default function WaveStack({
  className = '',
  waveCount = 3,
}: WaveStackProps) {
  // 每层参数：周期宽度、振幅、垂直偏移、速度、不透明度、延迟
  // path 在 viewBox(2400 x 120) 内绘制两个完整周期，保证 -50% 平移后无缝
  const layers = [
    { period: 600, amplitude: 18, baseY: 60, duration: 14, opacity: 0.55, delay: 0 },
    { period: 480, amplitude: 14, baseY: 70, duration: 11, opacity: 0.7, delay: -3 },
    { period: 720, amplitude: 22, baseY: 80, duration: 18, opacity: 0.9, delay: -6 },
  ].slice(0, waveCount);

  return (
    <>
      <style jsx>{`
        @keyframes wave-drift {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }
      `}</style>
      <div
        className={`relative w-full h-[150px] overflow-hidden ${className}`}
        aria-hidden
      >
        {/* 渐变定义：每层独立 id，避免复用同一渐变导致颜色串台 */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden>
          <defs>
            {layers.map((layer, i) => (
              <linearGradient
                key={i}
                id={`waveStackGradient-${i}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="var(--wave-fill-from)" stopOpacity={layer.opacity} />
                <stop offset="100%" stopColor="var(--wave-fill-to)" stopOpacity={Math.min(layer.opacity + 0.2, 1)} />
              </linearGradient>
            ))}
          </defs>
        </svg>

        {layers.map((layer, i) => {
          // 在 2400 宽内画两个完整周期（period * 2 * 2 = 4 个半周期 = 2 个周期）
          // 用 C/S 贝塞尔近似正弦
          const { period, amplitude, baseY } = layer;
          const totalWidth = 2400;
          let d = `M0,${baseY}`;
          let x = 0;
          let up = true;
          while (x < totalWidth) {
            const nextX = x + period / 2;
            const ctrlY = up ? baseY - amplitude : baseY + amplitude;
            // 三次贝塞尔：控制点在两端中间高度，端点回到 baseY，近似正弦半周期
            d += ` C${x + period / 4},${ctrlY} ${nextX - period / 4},${ctrlY} ${nextX},${baseY}`;
            x = nextX;
            up = !up;
          }
          d += ` L${totalWidth},120 L0,120 Z`;

          return (
            <svg
              key={i}
              className="absolute left-0 right-0"
              style={{
                width: '200vw',
                height: `${70 + i * 22}px`,
                bottom: `-${i * 14}px`,
                zIndex: layers.length - i,
                transformOrigin: 'left center',
                animation: `wave-drift ${layer.duration}s linear ${layer.delay}s infinite`,
                willChange: 'transform',
              }}
              data-name={`Wave ${i + 1}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 2400 120"
              preserveAspectRatio="none"
            >
              <path d={d} style={{ fill: `url(#waveStackGradient-${i})` }} />
            </svg>
          );
        })}
      </div>
    </>
  );
}
