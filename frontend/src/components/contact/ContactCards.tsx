'use client';
import { motion } from 'framer-motion';
import { Mail, Github, Twitter, Linkedin, MapPin, Clock, ArrowRight } from 'lucide-react';
interface ContactCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: string;
  linkText?: string;
  color?: string;
  bgGradient?: string;
}
export default function ContactCards() {
  const cards: ContactCard[] = [
    {
      id: 'email',
      icon: <Mail className="w-5 h-5" />,
      title: '邮件',
      description: 'contact@example.com',
      link: 'mailto:contact@example.com',
      linkText: '发送邮件',
      color: '#06b6d4',
      bgGradient: 'from-cyan-500/10 to-cyan-600/5',
    },
    {
      id: 'github',
      icon: <Github className="w-5 h-5" />,
      title: 'GitHub',
      description: '查看我的开源项目',
      link: 'https://github.com',
      linkText: '访问主页',
      color: '#6366f1',
      bgGradient: 'from-indigo-500/10 to-indigo-600/5',
    },
    {
      id: 'twitter',
      icon: <Twitter className="w-5 h-5" />,
      title: 'Twitter',
      description: '获取最新动态',
      link: 'https://twitter.com',
      linkText: '关注我',
      color: '#3b82f6',
      bgGradient: 'from-blue-500/10 to-blue-600/5',
    },
    {
      id: 'linkedin',
      icon: <Linkedin className="w-5 h-5" />,
      title: 'LinkedIn',
      description: '职业社交网络',
      link: 'https://linkedin.com',
      linkText: '连接',
      color: '#0ea5e9',
      bgGradient: 'from-sky-500/10 to-sky-600/5',
    },
    {
      id: 'location',
      title: '位置',
      icon: <MapPin className="w-5 h-5" />,
      description: '中国 · 上海',
      color: '#a855f7',
      bgGradient: 'from-purple-500/10 to-purple-600/5',
    },
    {
      id: 'timezone',
      title: '时区',
      icon: <Clock className="w-5 h-5" />,
      description: 'UTC+8 (中国标准时间)',
      color: '#f97316',
      bgGradient: 'from-orange-500/10 to-orange-600/5',
    },
  ];
  return (
    <section className="w-full py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="font-sf-pro-display text-3xl font-bold text-foreground mb-2">
              其他联系方式
            </h2>
            <p className="font-sf-pro-text text-foreground/70 max-w-2xl mx-auto">
              除了邮件，你也可以通过以下渠道联系我
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className={`
                    relative group h-full rounded-3xl
                    bg-gradient-to-br ${card.bgGradient}
                    dark:from-white/5 dark:to-black/5
                    border border-white/10 dark:border-white/5
                    shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]
                    hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)]
                    backdrop-blur-xl
                    overflow-hidden
                    transition-all duration-300
                  `}
                  style={{
                    '--card-color': card.color,
                  } as React.CSSProperties}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/0 via-black/0 to-black/0 dark:to-black/20 pointer-events-none" />
                  <div className="relative p-6 h-full flex flex-col">
                    <div className="relative mb-4">
                      <motion.div
                        whileHover={{ rotate: 5, scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                        className={`
                          w-12 h-12 rounded-2xl flex items-center justify-center
                          bg-white/80 dark:bg-black/40
                          shadow-lg
                          group-hover:shadow-xl
                          transition-all duration-300
                        `}
                        style={{
                          boxShadow: `0 4px 15px -3px ${card.color}40`,
                        }}
                      >
                        <div
                          className="text-foreground dark:text-white transition-colors duration-300"
                          style={{ color: card.color }}
                        >
                          {card.icon}
                        </div>
                      </motion.div>
                      
                      <motion.div
                        className="absolute -inset-2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `radial-gradient(circle, ${card.color}30 0%, transparent 70%)`,
                        }}
                      />
                    </div>
                    <h3 className="font-sf-pro-display text-lg font-semibold text-foreground mb-1.5">
                      {card.title}
                    </h3>
                    <p className="font-sf-pro-text text-foreground/60 text-sm mb-4 flex-grow leading-relaxed">
                      {card.description}
                    </p>
                    {card.link && (
                      <motion.a
                        href={card.link}
                        target={card.link?.startsWith('http') ? '_blank' : undefined}
                        rel={card.link?.startsWith('http') ? 'noopener noreferrer' : undefined}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center gap-1.5 text-sm font-medium font-sf-pro-text transition-colors"
                        style={{ color: card.color }}
                      >
                        {card.linkText}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </motion.a>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:via-[var(--card-color)] transition-all duration-500" />
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}