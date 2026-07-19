interface WaveStackProps {
  className?: string;
  waveCount?: number;
}

function pseudoRandom(index: number, seed: number = 12345): number {
  const x = Math.sin(seed + index * 9999) * 10000;
  return x - Math.floor(x);
}

/**
 * 多层波浪装饰；颜色来自 --wave-fill-from/to（variables.css）。
 */
export default function WaveStack({
  className = '',
  waveCount = 3,
}: WaveStackProps) {
  const wavePath =
    'M0,64 C120,32 240,96 360,64 S480,32 600,64 S720,96 840,64 S960,32 1080,64 S1200,96 1200,64 L1200,120 L0,120 Z';

  return (
    <>
      <style jsx>{`
        @keyframes wave-float-0 {
          0%,
          100% {
            transform: translateX(-10px) scaleY(1) scaleX(1);
          }
          50% {
            transform: translateX(10px) scaleY(1.3) scaleX(1.08) skewX(-2deg);
          }
        }
        @keyframes wave-float-1 {
          0%,
          100% {
            transform: translateX(8px) scaleY(1) scaleX(1.1);
          }
          50% {
            transform: translateX(-8px) scaleY(1.25) scaleX(1.15) skewX(3deg);
          }
        }
        @keyframes wave-float-2 {
          0%,
          100% {
            transform: translateX(-5px) scaleY(1) scaleX(1.2);
          }
          50% {
            transform: translateX(5px) scaleY(1.35) scaleX(1.25) skewX(-1deg);
          }
        }
      `}</style>
      <div className={`relative w-full h-[150px] overflow-hidden ${className}`}>
        <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden>
          <defs>
            <linearGradient
              id="waveStackGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="var(--wave-fill-from)" />
              <stop offset="100%" stopColor="var(--wave-fill-to)" />
            </linearGradient>
          </defs>
        </svg>
        {Array.from({ length: waveCount }).map((_, index) => {
          const randomDelay = pseudoRandom(index, 1) * 2;
          const randomDuration = 3 + pseudoRandom(index, 2) * 3;

          return (
            <svg
              key={index}
              className="absolute left-0 right-0"
              style={{
                width: '100vw',
                height: `${60 + index * 30}px`,
                bottom: `-${index * 20}px`,
                opacity: 1 - index * 0.15,
                transformOrigin: 'bottom center',
                zIndex: waveCount - index,
                animation: `wave-float-${index % 3} ${randomDuration}s cubic-bezier(0.68, -0.55, 0.265, 1.55) ${randomDelay}s infinite`,
                willChange: 'transform',
              }}
              data-name={`Wave ${index + 1}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path d={wavePath} style={{ fill: 'url(#waveStackGradient)' }} />
            </svg>
          );
        })}
      </div>
    </>
  );
}
