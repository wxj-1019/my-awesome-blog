'use client';
import { motion } from '@/lib/framer-motion';
import { Mail, Github, Twitter, Linkedin, MapPin, Clock, Globe } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
export default function HeroSection() {
  return (
    <section className="relative w-full py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-tech-cyan/20 via-purple-500/20 to-pink-500/20 dark:from-tech-cyan/10 dark:via-purple-500/10 dark:to-pink-500/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-tech-cyan/30 rounded-full blur-3xl dark:bg-tech-cyan/20" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl dark:bg-purple-500/20" />
      </div>
      <div className="relative z-10 container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-4xl mx-auto"
        >
          <GlassCard padding="lg" className="text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-8"
            >
              <div className="relative inline-block">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-tech-cyan to-purple-500 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-2xl">
                  <Mail className="w-16 h-16" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-black shadow-lg"
                />
              </div>
              <h1 className="font-sf-pro-display text-4xl md:text-5xl font-bold text-foreground mb-3">
                联系我
              </h1>
              <p className="font-sf-pro-text text-lg text-foreground/80 max-w-2xl mx-auto mb-6">
                很高兴与你交流。无论是技术咨询、商务合作，还是单纯聊天，欢迎随时联系我。
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                <span className="flex items-center gap-2 text-sm text-foreground/60 bg-foreground/10 dark:bg-foreground/5 px-4 py-2 rounded-full border border-foreground/20">
                  <MapPin className="w-4 h-4" />
                  <span>中国 · 上海</span>
                </span>
                <span className="flex items-center gap-2 text-sm text-foreground/60 bg-foreground/10 dark:bg-foreground/5 px-4 py-2 rounded-full border border-foreground/20">
                  <Clock className="w-4 h-4" />
                  <span>UTC+8</span>
                </span>
                <span className="flex items-center gap-2 text-sm text-foreground/60 bg-foreground/10 dark:bg-foreground/5 px-4 py-2 rounded-full border border-foreground/20">
                  <Globe className="w-4 h-4" />
                  <span>中英文交流</span>
                </span>
              </div>
            </motion.div>
            <div className="flex flex-wrap justify-center gap-4 pt-6 border-t border-foreground/10">
              <motion.a
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                href="mailto:contact@example.com"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-tech-cyan to-cyan-500 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
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
                className="flex items-center gap-2 px-6 py-3 bg-foreground/5 dark:bg-foreground/10 text-foreground dark:text-white rounded-2xl font-medium border border-foreground/20 hover:bg-foreground/10 dark:hover:bg-foreground/20 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                className="flex items-center gap-2 px-6 py-3 bg-foreground/5 dark:bg-foreground/10 text-foreground dark:text-white rounded-2xl font-medium border border-foreground/20 hover:bg-foreground/10 dark:hover:bg-foreground/20 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                className="flex items-center gap-2 px-6 py-3 bg-foreground/5 dark:bg-foreground/10 text-foreground dark:text-white rounded-2xl font-medium border border-foreground/20 hover:bg-foreground/10 dark:hover:bg-foreground/20 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Linkedin className="w-5 h-5" />
                LinkedIn
              </motion.a>
            </div>
          </GlassCard>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-foreground/60 max-w-xl mx-auto font-sf-pro-text">
              我通常在工作日的 <span className="text-tech-cyan font-semibold">24小时内</span> 回复邮件，紧急事项请通过社交媒体联系我。
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}