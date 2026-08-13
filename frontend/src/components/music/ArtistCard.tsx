'use client';

import { useState, useRef } from 'react';
import { motion } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Artist } from '@/types/music';

interface ArtistCardProps {
  artist: Artist;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  index?: number;
}

export default function ArtistCard({ artist, size = 'medium', onClick, index = 0 }: ArtistCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });
  // 减少动画偏好：入场动效回退为直接呈现
  const reducedMotion = useReducedMotion();

  const sizeClasses = {
    small: 'w-20 h-20',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) {return;}
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;
    
    setTransform({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setTransform({ rotateX: 0, rotateY: 0 });
  };

  return (
    <motion.div
      className={cn(
        'group cursor-pointer perspective-1000',
      )}
      onClick={onClick}
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.06,
        ease: [0.25, 0.1, 0.25, 1]
      }}
    >
      <motion.div 
        ref={cardRef}
        className={cn(
          'rounded-full overflow-hidden shadow-md preserve-3d',
          sizeClasses[size]
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX: transform.rotateX,
          rotateY: transform.rotateY,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        whileHover={{ 
          scale: 1.08,
          boxShadow: '0 20px 40px color-mix(in srgb, var(--primary) 30%, transparent)'
        }}
      >
        <motion.img 
          src={artist.avatar} 
          alt={artist.name}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.4 }}
        />
      </motion.div>

      <motion.div 
        className="mt-3 text-center"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.06 + 0.1 }}
      >
        <h3 className="text-sm font-display font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-300">
          {artist.name}
        </h3>
        {artist.fans && (
          <p className="text-xs text-muted-foreground">
            {formatFans(artist.fans)}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

function formatFans(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万粉丝`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}千粉丝`;
  }
  return `${count}粉丝`;
}
