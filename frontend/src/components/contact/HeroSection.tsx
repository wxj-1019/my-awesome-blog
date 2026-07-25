'use client';
import { motion } from '@/lib/framer-motion';
import { Mail, Github, Twitter, Linkedin, MapPin, Clock, Globe } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageActHeader from '@/components/layout/PageActHeader';
import { FadeIn, BlurIn } from '@/components/motion';

export default function HeroSection() {
  return (
    <section className="relative w-full py-16 md:py-24 overflow-hidden">
      {/* 背景光斑：全部走 tech 色板 token，单值即可双主题自适应 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-tech-cyan/15 via-tech-purple/15 to-tech-pink/15" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-tech-cyan/25 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-tech-purple/25 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 container mx-auto px-4 sm:px-6">
        {/* 幕标式页头（自带 FadeIn 与 reduced-motion 回退） */}
        <PageActHeader
          kicker="联络 · CONTACT"
          title="联系我"
          description="很高兴与你交流。无论是技术咨询、商务合作，还是单纯聊天，欢迎随时联系我。"
        />
        <FadeIn delay={0.15} className="max-w-4xl mx-auto">
          <GlassCard padding="lg" className="text-center">
            <BlurIn delay={0.2} className="mb-8">
              <div className="relative inline-block">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-tech-cyan to-tech-purple rounded-full flex items-center justify-center text-primary-foreground text-5xl font-bold shadow-2xl">
                  <Mail className="w-16 h-16" />
                </div>
                <FadeIn
                  direction="none"
                  delay={0.5}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-success rounded-full border-4 border-background shadow-lg"
                >
                  {null}
                </FadeIn>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                <span className="flex items-center gap-2 text-sm text-foreground/60 bg-foreground/10 px-4 py-2 rounded-full border border-foreground/20">
                  <MapPin className="w-4 h-4" />
                  <span>中国 · 上海</span>
                </span>
                <span className="flex items-center gap-2 text-sm text-foreground/60 bg-foreground/10 px-4 py-2 rounded-full border border-foreground/20">
                  <Clock className="w-4 h-4" />
                  <span>UTC+8</span>
                </span>
                <span className="flex items-center gap-2 text-sm text-foreground/60 bg-foreground/10 px-4 py-2 rounded-full border border-foreground/20">
                  <Globe className="w-4 h-4" />
                  <span>中英文交流</span>
                </span>
              </div>
            </BlurIn>
            <div className="flex flex-wrap justify-center gap-4 pt-6 border-t border-foreground/10">
              <motion.a
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                href="mailto:contact@example.com"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-tech-cyan to-tech-sky text-primary-foreground rounded-2xl font-medium shadow-lg hover:shadow-xl transition-colors duration-200"
              >
                <Mail className="w-5 h-5" />
                邮件联系
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-foreground/5 text-foreground rounded-2xl font-medium border border-foreground/20 hover:bg-foreground/10 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <Github className="w-5 h-5" />
                GitHub
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-foreground/5 text-foreground rounded-2xl font-medium border border-foreground/20 hover:bg-foreground/10 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <Twitter className="w-5 h-5" />
                Twitter
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-foreground/5 text-foreground rounded-2xl font-medium border border-foreground/20 hover:bg-foreground/10 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <Linkedin className="w-5 h-5" />
                LinkedIn
              </motion.a>
            </div>
          </GlassCard>
          <FadeIn delay={0.3} className="mt-8 text-center">
            <p className="text-foreground/60 max-w-xl mx-auto font-sf-pro-text">
              我通常在工作日的 <span className="text-tech-cyan font-semibold">24小时内</span> 回复邮件，紧急事项请通过社交媒体联系我。
            </p>
          </FadeIn>
        </FadeIn>
      </div>
    </section>
  );
}
