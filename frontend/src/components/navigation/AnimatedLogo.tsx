'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedLogoProps {
  isNavbarHovered?: boolean;
}

export default function AnimatedLogo({ isNavbarHovered = false }: AnimatedLogoProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href="/"
      className="flex items-center space-x-2 text-tech-cyan hover:text-tech-cyan transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo 图标 - 只在导航栏 hover 时显示 */}
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-tech-cyan to-tech-lightcyan transition-all duration-300 overflow-hidden",
        isNavbarHovered ? "opacity-100 scale-100" : "opacity-0 scale-75 w-0"
      )}>
        <svg
          viewBox="0 0 29.667 31.69"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            "w-6 h-6 text-white transition-all duration-300",
            isHovered && "scale-110"
          )}
        >
          <path
            transform="translate(0 0)"
            d="M12.827,1.628A1.561,1.561,0,0,1,14.31,0h2.964a1.561,1.561,0,0,1,1.483,1.628v11.9a9.252,9.252,0,0,1-2.432,6.852q-2.432,2.409-6.963,2.409T2.4,20.452Q0,18.094,0,13.669V1.628A1.561,1.561,0,0,1,1.483,0h2.98A1.561,1.561,0,0,1,5.947,1.628V13.191a5.635,5.635,0,0,0,.85,3.451,3.153,3.153,0,0,0,2.632,1.094,3.032,3.032,0,0,0,2.582-1.076,5.836,5.836,0,0,0,.816-3.486Z"
            fill="currentColor"
          />
          <path
            transform="translate(-45.91 0)"
            d="M75.207,20.857a1.561,1.561,0,0,1-1.483,1.628h-2.98a1.561,1.561,0,0,1-1.483-1.628V1.628A1.561,1.561,0,0,1,70.743,0h2.98a1.561,1.561,0,0,1,1.483,1.628Z"
            fill="currentColor"
          />
          <path
            transform="translate(0 -51.963)"
            d="M0,80.018A1.561,1.561,0,0,1,1.483,78.39h26.7a1.561,1.561,0,0,1,1.483,1.628v2.006a1.561,1.561,0,0,1-1.483,1.628H1.483A1.561,1.561,0,0,1,0,82.025Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Logo 文字 - 只在导航栏 hover 时显示 */}
      <div className="flex flex-col overflow-hidden">
        <span className={cn(
          "font-bold text-foreground whitespace-nowrap transition-all duration-300 ease-out",
          isNavbarHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
        )}>
          {isHovered ? 'Awesome Blog' : 'Blog'}
        </span>
      </div>
    </Link>
  );
}
