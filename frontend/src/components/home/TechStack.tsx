'use client'

import { Code2, Database, Server, Cpu, Layout, Cloud, Shield, Zap } from 'lucide-react'
import LogoLoop, { type LogoItem } from '@/components/ui/LogoLoop'

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

const logoLoopItems: LogoItem[] = techItems.map((item) => ({
  node: (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-glass/30 backdrop-blur-xl border border-glass-border hover:bg-glass/50 hover:border-tech-cyan/30 transition-all duration-300 group"
    >
      <div className="text-gray-400 group-hover:text-tech-cyan transition-colors">
        {item.icon}
      </div>
      <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
        {item.name}
      </span>
    </div>
  ),
  href: item.href,
  title: item.name,
  ariaLabel: `Learn more about ${item.name}`,
}))

export default function TechStack() {
  return (
    <section className="py-6 sm:py-8 md:py-10 lg:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-5 sm:mb-6">
          <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-tech-cyan to-tech-sky rounded-full animate-fade-in-up" />
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground animate-fade-in-up">
            技术栈
          </h2>
          <span className="text-xs sm:text-sm text-muted-foreground animate-fade-in-up delay-100">
            Technologies & Tools
          </span>
        </div>

        <div className="relative bg-glass/20 backdrop-blur-xl border border-glass-border rounded-lg p-4 sm:p-6 md:p-8 overflow-hidden">
          <div data-testid="tech-orbital-layer" className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-tech-cyan/15 shadow-[0_0_60px_rgba(6,182,212,.12)]" />
            <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-tech-sky/20" />
            <div className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-tech-cyan/25 to-transparent" />
            <div className="absolute left-1/2 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-tech-cyan/20 to-transparent" />
          </div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-tech-cyan to-transparent opacity-50 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-tech-cyan to-transparent opacity-50 animate-pulse" />

          <div className="mb-5">
            <p className="text-sm sm:text-base text-muted-foreground">
              本项目使用现代化技术栈构建，注重性能、可维护性和开发体验。
            </p>
          </div>

          <div className="py-3 sm:py-4">
            <LogoLoop
              logos={logoLoopItems}
              speed={80}
              direction="left"
              pauseOnHover={true}
              ariaLabel="Technology stack logos"
              className="w-full"
            />
          </div>

          <div className="mt-5 sm:mt-6 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
            {techItems.slice(0, 8).map((item, index) => (
              <div
                key={item.name}
                className="flex flex-col items-center p-2 sm:p-3 rounded-lg bg-glass/30 backdrop-blur-xl border border-glass-border hover:border-tech-cyan/30 hover:scale-105 transition-all duration-300 cursor-pointer group animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-glass/50 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:bg-tech-cyan/20 transition-colors"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <div className="text-gray-400 group-hover:text-tech-cyan transition-colors">
                    {item.icon}
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-gray-300 group-hover:text-white transition-colors text-center truncate w-full">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 sm:mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-glass/30 backdrop-blur-xl border border-glass-border rounded-lg p-4 sm:p-5 hover:-translate-y-1 transition-transform duration-300 cursor-pointer group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-tech-cyan to-tech-sky flex items-center justify-center mb-3">
              <Code2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 group-hover:text-tech-cyan transition-colors">
              前端开发
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Next.js 14 + React + TypeScript，打造高性能、SEO友好的现代化Web应用
            </p>
          </div>

          <div className="bg-glass/30 backdrop-blur-xl border border-glass-border rounded-lg p-4 sm:p-5 hover:-translate-y-1 transition-transform duration-300 cursor-pointer group delay-100">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3">
              <Server className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 group-hover:text-tech-cyan transition-colors">
              后端服务
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              FastAPI + PostgreSQL + Redis，提供快速、可靠的API服务和数据存储
            </p>
          </div>

          <div className="bg-glass/30 backdrop-blur-xl border border-glass-border rounded-lg p-4 sm:p-5 hover:-translate-y-1 transition-transform duration-300 cursor-pointer group delay-200">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-3">
              <Cloud className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 group-hover:text-tech-cyan transition-colors">
              部署运维
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Docker + Vercel，实现容器化部署和自动化CI/CD流程
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
