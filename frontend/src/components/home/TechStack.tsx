'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { Code2, Database, Server, Cpu, Layout, Cloud, Shield, Zap, Wrench } from 'lucide-react'
import LogoLoop, { type LogoItem } from '@/components/ui/LogoLoop'
import ScrollReveal from './decorations/ScrollReveal'
import { staggerContainer, staggerItem, VIEWPORT } from '@/lib/animation-utils'

interface TechItem {
  name: string
  icon: React.ReactNode
  color: string
  href?: string
}

const techItems: TechItem[] = [
  { name: 'Next.js', icon: <Code2 className="w-6 h-6" />, color: '#ffffff', href: 'https://nextjs.org' },
  { name: 'React', icon: <Code2 className="w-6 h-6" />, color: '#61DAFB', href: 'https://react.dev' },
  { name: 'TypeScript', icon: <Code2 className="w-6 h-6" />, color: '#3178C6', href: 'https://www.typescriptlang.org' },
  { name: 'Tailwind CSS', icon: <Layout className="w-6 h-6" />, color: '#06B6D4', href: 'https://tailwindcss.com' },
  { name: 'FastAPI', icon: <Zap className="w-6 h-6" />, color: '#009688', href: 'https://fastapi.tiangolo.com' },
  { name: 'Python', icon: <Server className="w-6 h-6" />, color: '#3776AB', href: 'https://www.python.org' },
  { name: 'PostgreSQL', icon: <Database className="w-6 h-6" />, color: '#4169E1', href: 'https://www.postgresql.org' },
  { name: 'Docker', icon: <Cloud className="w-6 h-6" />, color: '#2496ED', href: 'https://www.docker.com' },
  { name: 'Redis', icon: <Shield className="w-6 h-6" />, color: '#DC382D', href: 'https://redis.io' },
  { name: 'Git', icon: <Code2 className="w-6 h-6" />, color: '#F05032', href: 'https://git-scm.com' },
  { name: 'Linux', icon: <Cpu className="w-6 h-6" />, color: '#FCC624', href: 'https://www.linux.org' },
  { name: 'Vercel', icon: <Cloud className="w-6 h-6" />, color: '#000000', href: 'https://vercel.com' },
]

const APPLE_EASE = [0.25, 0.1, 0.25, 1] as const

// 浮动粒子装饰
function FloatingDots() {
  const [dots, setDots] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([])

  useEffect(() => {
    setDots(
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        delay: Math.random() * 2,
      }))
    )
  }, [])

  if (dots.length === 0) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute rounded-full bg-tech-cyan/30"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            delay: dot.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

const logoLoopItems: LogoItem[] = techItems.map((item) => ({
  node: (
    <motion.div
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-glass/30 backdrop-blur-xl border border-glass-border hover:bg-glass/50 hover:border-tech-cyan/30 transition-colors duration-200 group"
      whileHover={{ scale: 1.05, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <motion.div 
        className="text-gray-400 group-hover:text-tech-cyan transition-colors"
        whileHover={{ rotate: 180 }}
        transition={{ duration: 0.5 }}
      >
        {item.icon}
      </motion.div>
      <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
        {item.name}
      </span>
    </motion.div>
  ),
  href: item.href,
  title: item.name,
  ariaLabel: `Learn more about ${item.name}`,
}))

interface TechIconCardProps {
  item: TechItem
  index: number
}

function TechIconCard({ item, index }: TechIconCardProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      variants={staggerItem}
      className="flex flex-col items-center p-2 sm:p-3 rounded-lg bg-glass/30 backdrop-blur-xl border border-glass-border cursor-pointer group relative overflow-hidden"
      whileHover={shouldReduceMotion ? {} : {
        scale: 1.05,
        y: -4,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      }}
    >
      {/* 悬停光晕 */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-tech-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />
      
      <motion.div
        className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mb-1.5 sm:mb-2 relative z-10"
        style={{ backgroundColor: `${item.color}20` }}
        whileHover={shouldReduceMotion ? {} : {
          rotate: 360,
          scale: 1.1,
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <div style={{ color: item.color }}>
          {item.icon}
        </div>
      </motion.div>
      <span className="text-[10px] sm:text-xs font-medium text-gray-300 group-hover:text-white transition-colors text-center truncate w-full relative z-10">
        {item.name}
      </span>
      
      {/* 发光效果 */}
      <motion.div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: `0 0 20px ${item.color}40`,
        }}
      />
    </motion.div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
  delay: number
}

function FeatureCard({ icon, title, description, gradient, delay }: FeatureCardProps) {
  const shouldReduceMotion = useReducedMotion()
  
  return (
    <motion.div
      variants={staggerItem}
      className="bg-glass/30 backdrop-blur-xl border border-glass-border rounded-lg p-4 sm:p-5 cursor-pointer group relative overflow-hidden"
      whileHover={shouldReduceMotion ? {} : {
        y: -8,
        scale: 1.02,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      }}
    >
      {/* 悬停背景渐变 */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300"
        style={{ background: `linear-gradient(135deg, ${gradient.includes('tech-cyan') ? '#06b6d4' : gradient.includes('purple') ? '#8b5cf6' : '#f97316'}, transparent)` }}
      />
      
      <motion.div
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 relative z-10`}
        whileHover={shouldReduceMotion ? {} : {
          scale: 1.15,
          rotate: 5,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        {icon}
        {/* 脉冲效果 */}
        <motion.div
          className="absolute inset-0 rounded-lg bg-white/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 group-hover:text-tech-cyan transition-colors relative z-10">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground relative z-10">
        {description}
      </p>
    </motion.div>
  )
}

export default function TechStack() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start']
  })

  const y1 = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [30, -30])
  const y2 = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [20, -20])

  const titleRef = useRef<HTMLDivElement>(null)
  const isTitleInView = useInView(titleRef, { once: true, margin: '-100px' })

  return (
    <section ref={sectionRef} className="py-6 sm:py-8 md:py-10 lg:py-12 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题区域 */}
        <motion.div
          ref={titleRef}
          className="flex items-center gap-3 mb-5 sm:mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={isTitleInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.6, ease: APPLE_EASE }}
        >
          <motion.div
            className="w-1 h-6 sm:h-8 bg-gradient-to-b from-tech-cyan to-tech-sky rounded-full relative"
            animate={{
              boxShadow: [
                '0 0 10px rgba(6, 182, 212, 0.3)',
                '0 0 25px rgba(6, 182, 212, 0.6)',
                '0 0 10px rgba(6, 182, 212, 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="absolute inset-0 bg-white/50 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
            技术栈
          </h2>
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Wrench className="w-5 h-5 text-tech-cyan/60" />
          </motion.div>
          <motion.span
            className="text-xs sm:text-sm text-muted-foreground ml-auto"
            initial={{ opacity: 0, x: 20 }}
            animate={isTitleInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Technologies & Tools
          </motion.span>
        </motion.div>

        {/* 主卡片区域 */}
        <motion.div
          className="relative bg-glass/20 backdrop-blur-xl border border-glass-border rounded-lg p-4 sm:p-6 md:p-8 overflow-hidden"
          style={{ y: y1 }}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: APPLE_EASE }}
        >
          <FloatingDots />
          
          {/* 顶部流光线条 */}
          <motion.div
            className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-tech-cyan to-transparent"
            animate={{ 
              opacity: [0.3, 0.8, 0.3],
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ backgroundSize: '200% 200%' }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-tech-cyan to-transparent"
            animate={{ 
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          />

          {/* 描述文字 */}
          <motion.div 
            className="mb-5"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-sm sm:text-base text-muted-foreground">
              本项目使用现代化技术栈构建，注重性能、可维护性和开发体验。
            </p>
          </motion.div>

          {/* Logo 循环滚动 */}
          <motion.div 
            className="py-3 sm:py-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <LogoLoop
              logos={logoLoopItems}
              speed={80}
              direction="left"
              pauseOnHover={true}
              ariaLabel="Technology stack logos"
              className="w-full"
            />
          </motion.div>

          {/* 技术图标网格 */}
          <motion.div
            variants={staggerContainer(0.05)}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT.ONCE}
            className="mt-5 sm:mt-6 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3"
          >
            {techItems.slice(0, 8).map((item, index) => (
              <TechIconCard key={item.name} item={item} index={index} />
            ))}
          </motion.div>
        </motion.div>

        {/* 特性卡片区域 */}
        <motion.div
          className="mt-5 sm:mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
          style={{ y: y2 }}
          variants={staggerContainer(0.15)}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT.ONCE}
        >
          <FeatureCard
            icon={<Code2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
            title="前端开发"
            description="Next.js 14 + React + TypeScript，打造高性能、SEO友好的现代化Web应用"
            gradient="from-tech-cyan to-tech-sky"
            delay={0.1}
          />
          <FeatureCard
            icon={<Server className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
            title="后端服务"
            description="FastAPI + PostgreSQL + Redis，提供快速、可靠的API服务和数据存储"
            gradient="from-purple-500 to-pink-500"
            delay={0.2}
          />
          <FeatureCard
            icon={<Cloud className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
            title="部署运维"
            description="Docker + Vercel，实现容器化部署和自动化CI/CD流程"
            gradient="from-orange-500 to-red-500"
            delay={0.3}
          />
        </motion.div>
      </div>
    </section>
  )
}
