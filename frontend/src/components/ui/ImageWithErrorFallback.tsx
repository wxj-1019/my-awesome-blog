'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ImageWithErrorFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  showLoading?: boolean;
}

export function ImageWithErrorFallback({
  src,
  alt,
  fallback = '/assets/avatar.jpg',
  showLoading = true,
  className,
  ...props
}: ImageWithErrorFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(showLoading);

  const handleError = () => {
    setImgSrc(fallback);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        src={imgSrc}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        {...props}
      />
    </div>
  );
}

export default ImageWithErrorFallback;
