'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface LottieAnimationProps {
  src?: string | object;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const LottieAnimation: React.FC<LottieAnimationProps> = ({
  src = 'https://assets5.lottiefiles.com/packages/lf20_qp1q7mct.json', // Default Movie Projector
  loop = true,
  autoplay = true,
  className,
  style,
}) => {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    if (typeof src === 'string') {
      fetch(src)
        .then((response) => response.json())
        .then((data) => setAnimationData(data))
        .catch((error) => console.error('Error loading Lottie animation:', error));
    } else {
      setAnimationData(src);
    }
  }, [src]);

  if (!animationData) {
    return <div className={cn("animate-pulse bg-white/10 rounded-lg", className)} style={style} />;
  }

  return (
    <div className={cn("relative", className)} style={style}>
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default LottieAnimation;
