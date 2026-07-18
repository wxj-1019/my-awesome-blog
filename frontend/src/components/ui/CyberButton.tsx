import React from 'react';
import { cn } from '@/lib/utils';


interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const CyberButton: React.FC<CyberButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props 
}) => {
  const baseStyles = "relative font-syne uppercase tracking-wider font-bold transition-all duration-300 clip-path-cyber hover:translate-x-[-2px] hover:translate-y-[-2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  
  const variants = {
    primary: "bg-tech-cyan text-black hover:bg-tech-lightcyan hover:shadow-[4px_4px_0_var(--shadow-tech-cyan)]",
    secondary: "bg-tech-purple text-white hover:bg-tech-purple/80 hover:shadow-[4px_4px_0_var(--shadow-tech-purple)]",
    accent: "bg-tech-pink text-white hover:bg-tech-pink/80 hover:shadow-[4px_4px_0_var(--shadow-tech-pink)]",
    outline: "bg-transparent border border-tech-cyan text-tech-cyan hover:bg-tech-cyan/10 hover:shadow-[0_0_15px_var(--shadow-tech-cyan)]",
  };

  const sizes = {
    sm: "px-4 py-1 text-xs",
    md: "px-6 py-2 text-sm",
    lg: "px-8 py-3 text-base",
  };

  return (
    <button 
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        isLoading && "opacity-70 cursor-not-allowed",
        disabled && "opacity-50 cursor-not-allowed hover:transform-none hover:shadow-none",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Corner decorations */}
      <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/50" />
      <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/50" />
      
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </span>
      ) : children}
    </button>
  );
};

export default CyberButton;
