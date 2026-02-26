'use client';

import { useEffect, useRef, memo } from 'react';
import { useTheme } from '@/context/theme-context';
import { cn } from '@/lib/utils';

interface DynamicBackgroundProps {
  className?: string;
}

type ParticleType = 'bubble' | 'star' | 'heart' | 'cloud' | 'sparkle';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  opacity: number;
  color: string;
  type: ParticleType;
  rotation: number;
  rotationSpeed: number;
  pulsePhase: number;
  pulseSpeed: number;
  floatPhase: number;
  floatAmplitude: number;
}

const DynamicBackground = memo(function DynamicBackground({ className }: DynamicBackgroundProps) {
  const { resolvedTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const timeRef = useRef(0);

  useEffect(() => {
    if (resolvedTheme !== 'light' || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const cuteColors = [
      { fill: 'rgba(255, 182, 193, 0.6)', stroke: 'rgba(255, 105, 180, 0.4)' },
      { fill: 'rgba(173, 216, 230, 0.6)', stroke: 'rgba(135, 206, 250, 0.4)' },
      { fill: 'rgba(221, 160, 221, 0.6)', stroke: 'rgba(186, 85, 211, 0.4)' },
      { fill: 'rgba(255, 218, 185, 0.6)', stroke: 'rgba(255, 165, 0, 0.4)' },
      { fill: 'rgba(152, 251, 152, 0.6)', stroke: 'rgba(50, 205, 50, 0.4)' },
      { fill: 'rgba(255, 239, 213, 0.6)', stroke: 'rgba(255, 200, 100, 0.4)' },
      { fill: 'rgba(230, 230, 250, 0.6)', stroke: 'rgba(147, 112, 219, 0.4)' },
      { fill: 'rgba(176, 224, 230, 0.6)', stroke: 'rgba(0, 206, 209, 0.4)' },
    ];

    const particleTypes: ParticleType[] = ['bubble', 'star', 'heart', 'cloud', 'sparkle'];
    const particleCount = Math.min(40, Math.floor(window.innerWidth / 35));

    particlesRef.current = Array.from({ length: particleCount }, () => {
      const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
      const colorSet = cuteColors[Math.floor(Math.random() * cuteColors.length)];
      const baseRadius = type === 'cloud' ? 30 + Math.random() * 25 : 
                         type === 'heart' ? 15 + Math.random() * 15 :
                         type === 'star' ? 12 + Math.random() * 12 :
                         type === 'sparkle' ? 8 + Math.random() * 8 :
                         20 + Math.random() * 30;
      
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -0.3 - Math.random() * 0.8,
        radius: baseRadius,
        baseRadius,
        opacity: 0.4 + Math.random() * 0.4,
        color: colorSet.fill,
        type,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        floatPhase: Math.random() * Math.PI * 2,
        floatAmplitude: 20 + Math.random() * 30,
      };
    });

    const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, rotation: number) => {
      const spikes = 5;
      const outerRadius = radius;
      const innerRadius = radius * 0.4;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        if (i === 0) {
          ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        } else {
          ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
      }
      
      ctx.closePath();
      ctx.restore();
    };

    const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      
      const topCurveHeight = radius * 0.3;
      ctx.moveTo(0, topCurveHeight);
      ctx.bezierCurveTo(0, -topCurveHeight, -radius, -topCurveHeight, -radius, topCurveHeight * 0.5);
      ctx.bezierCurveTo(-radius, radius * 0.8, 0, radius, 0, radius * 1.2);
      ctx.bezierCurveTo(0, radius, radius, radius * 0.8, radius, topCurveHeight * 0.5);
      ctx.bezierCurveTo(radius, -topCurveHeight, 0, -topCurveHeight, 0, topCurveHeight);
      
      ctx.restore();
    };

    const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.arc(x - radius * 0.6, y + radius * 0.2, radius * 0.7, 0, Math.PI * 2);
      ctx.arc(x + radius * 0.6, y + radius * 0.2, radius * 0.7, 0, Math.PI * 2);
      ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.5, 0, Math.PI * 2);
      ctx.arc(x + radius * 0.3, y - radius * 0.3, radius * 0.5, 0, Math.PI * 2);
    };

    const drawSparkle = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        const angle = (i * Math.PI) / 2;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        ctx.lineWidth = 2;
        ctx.strokeStyle = ctx.fillStyle as string;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    };

    const drawRipple = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, opacity: number) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 182, 193, ${opacity})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const ripples: Array<{ x: number; y: number; radius: number; opacity: number }> = [];

    const animate = (currentTime: number) => {
      animationRef.current = requestAnimationFrame(animate);
      timeRef.current = currentTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradientBg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradientBg.addColorStop(0, 'rgba(255, 240, 245, 0.3)');
      gradientBg.addColorStop(0.5, 'rgba(240, 248, 255, 0.3)');
      gradientBg.addColorStop(1, 'rgba(255, 250, 240, 0.3)');
      ctx.fillStyle = gradientBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, index) => {
        particle.pulsePhase += particle.pulseSpeed;
        particle.radius = particle.baseRadius * (1 + 0.2 * Math.sin(particle.pulsePhase));
        
        particle.floatPhase += 0.02;
        const floatOffset = Math.sin(particle.floatPhase) * particle.floatAmplitude * 0.02;
        
        particle.x += particle.vx;
        particle.y += particle.vy + floatOffset;
        particle.rotation += particle.rotationSpeed;

        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          const force = (150 - distance) / 150;
          particle.vx -= (dx / distance) * force * 0.5;
          particle.vy -= (dy / distance) * force * 0.5;
          
          if (Math.random() < 0.02) {
            ripples.push({
              x: particle.x,
              y: particle.y,
              radius: particle.radius,
              opacity: 0.5
            });
          }
        }

        particle.vx *= 0.99;
        particle.vy *= 0.99;
        particle.vy = Math.min(particle.vy, -0.2);

        if (particle.x < -particle.radius * 2) particle.x = canvas.width + particle.radius;
        if (particle.x > canvas.width + particle.radius * 2) particle.x = -particle.radius;
        if (particle.y < -particle.radius * 2) {
          particle.y = canvas.height + particle.radius;
          particle.x = Math.random() * canvas.width;
        }
        if (particle.y > canvas.height + particle.radius * 2) particle.y = -particle.radius;

        ctx.globalAlpha = particle.opacity;

        switch (particle.type) {
          case 'bubble':
            const bubbleGradient = ctx.createRadialGradient(
              particle.x - particle.radius * 0.3,
              particle.y - particle.radius * 0.3,
              0,
              particle.x,
              particle.y,
              particle.radius
            );
            bubbleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            bubbleGradient.addColorStop(0.3, particle.color);
            bubbleGradient.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = bubbleGradient;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(
              particle.x - particle.radius * 0.3,
              particle.y - particle.radius * 0.3,
              particle.radius * 0.2,
              0,
              Math.PI * 2
            );
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fill();
            break;

          case 'star':
            ctx.fillStyle = particle.color;
            drawStar(ctx, particle.x, particle.y, particle.radius, particle.rotation);
            ctx.fill();
            
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
            break;

          case 'heart':
            ctx.fillStyle = particle.color;
            drawHeart(ctx, particle.x, particle.y, particle.radius, particle.rotation);
            ctx.fill();
            
            ctx.shadowColor = 'rgba(255, 105, 180, 0.5)';
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;
            break;

          case 'cloud':
            ctx.fillStyle = particle.color;
            drawCloud(ctx, particle.x, particle.y, particle.radius);
            ctx.fill();
            break;

          case 'sparkle':
            ctx.fillStyle = particle.color;
            drawSparkle(ctx, particle.x, particle.y, particle.radius, particle.rotation);
            break;
        }

        ctx.globalAlpha = 1;
      });

      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i];
          const p2 = particlesRef.current[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 180) {
            const opacity = 0.15 * (1 - distance / 180);
            const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            gradient.addColorStop(0, `rgba(255, 182, 193, ${opacity})`);
            gradient.addColorStop(0.5, `rgba(173, 216, 230, ${opacity})`);
            gradient.addColorStop(1, `rgba(221, 160, 221, ${opacity})`);
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        ripple.radius += 2;
        ripple.opacity -= 0.02;
        
        if (ripple.opacity <= 0) {
          ripples.splice(i, 1);
        } else {
          drawRipple(ctx, ripple.x, ripple.y, ripple.radius, ripple.opacity);
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [resolvedTheme]);

  if (resolvedTheme !== 'light') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        'fixed inset-0 pointer-events-none z-0',
        'opacity-80',
        className
      )}
      aria-hidden="true"
    />
  );
});

export default DynamicBackground;
