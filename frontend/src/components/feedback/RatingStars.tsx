'use client';

import { useState, forwardRef } from 'react';
import { motion } from '@/lib/framer-motion';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  showLabel?: boolean;
  className?: string;
  labelClassName?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const spacingClasses = {
  sm: 'gap-0.5',
  md: 'gap-1',
  lg: 'gap-1.5',
};

export default forwardRef<HTMLDivElement, RatingStarsProps>(function RatingStars(
  {
    value,
    onChange,
    max = 5,
    size = 'md',
    readonly = false,
    showLabel = false,
    className,
    labelClassName,
  },
  _ref
) {
  const [hoverValue, setHoverValue] = useState(0);

  const handleMouseEnter = (index: number) => {
    if (!readonly) {
      setHoverValue(index);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(0);
  };

  const handleClick = (index: number) => {
    if (!readonly && onChange) {
      onChange(index);
    }
  };

  const renderStar = (index: number) => {
    const starValue = index;
    const currentDisplayValue = hoverValue || value;
    const isFull = starValue <= currentDisplayValue;
    const isHalf = starValue - 0.5 === currentDisplayValue;

    return (
      <motion.button
        key={starValue}
        type="button"
        disabled={readonly}
        onClick={() => handleClick(index)}
        onMouseEnter={() => handleMouseEnter(index)}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'transition-all duration-200 cursor-pointer',
          readonly && 'cursor-default',
          !readonly && 'hover:scale-110'
        )}
        whileHover={!readonly ? { scale: 1.2 } : undefined}
        whileTap={!readonly ? { scale: 0.95 } : undefined}
      >
        {isFull ? (
          <Star
            className={cn(
              sizeClasses[size],
              'fill-tech-cyan text-tech-cyan',
              'drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]'
            )}
          />
        ) : isHalf ? (
          <StarHalf
            className={cn(
              sizeClasses[size],
              'fill-tech-cyan/50 text-tech-cyan'
            )}
          />
        ) : (
          <Star
            className={cn(
              sizeClasses[size],
              'fill-foreground/20 text-foreground/40'
            )}
          />
        )}
      </motion.button>
    );
  };

  const getRatingText = (rating: number): string => {
    const percentage = (rating / max) * 100;
    if (percentage >= 80) {return '非常满意';}
    if (percentage >= 60) {return '满意';}
    if (percentage >= 40) {return '一般';}
    if (percentage >= 20) {return '不满意';}
    return '非常不满意';
  };

  return (
    <div className={cn('flex items-center', className)}>
      <div className={cn('flex items-center', spacingClasses[size])}>
        {Array.from({ length: max }, (_, i) => renderStar(i + 1))}
      </div>

      {showLabel && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn('ml-2 text-sm font-medium text-foreground/70', labelClassName)}
        >
          {getRatingText(value)} ({value.toFixed(1)})
        </motion.span>
      )}
    </div>
  );
});
