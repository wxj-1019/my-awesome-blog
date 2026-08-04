'use client';
import { motion } from '@/lib/framer-motion';
import { Mail, Github, Twitter, Linkedin, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Stagger, StaggerItem, HoverLift } from '@/components/motion';
import { ScrollRevealLine } from '@/components/gsap/ScrollNarrative';

interface ContactCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: string;
  linkText?: string;
  /** 主题色：CSS 变量 token，配合 color-mix 派生透明度 */
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
      color: 'var(--tech-cyan)',
      bgGradient: 'from-tech-cyan/10 to-tech-cyan/5',
    },
    {
      id: 'github',
      icon: <Github className="w-5 h-5" />,
      title: 'GitHub',
      description: '查看我的开源项目',
      link: 'https://github.com',
      linkText: '访问主页',
      color: 'var(--tech-purple)',
      bgGradient: 'from-tech-purple/10 to-tech-purple/5',
    },
    {
      id: 'twitter',
      icon: <Twitter className="w-5 h-5" />,
      title: 'Twitter',
      description: '获取最新动态',
      link: 'https://twitter.com',
      linkText: '关注我',
      color: 'var(--info)',
      bgGradient: 'from-info/10 to-info/5',
    },
    {
      id: 'linkedin',
      icon: <Linkedin className="w-5 h-5" />,
      title: 'LinkedIn',
      description: '职业社交网络',
      link: 'https://linkedin.com',
      linkText: '连接',
      color: 'var(--tech-lightcyan)',
      bgGradient: 'from-tech-lightcyan/10 to-tech-lightcyan/5',
    },
    {
      id: 'location',
      title: '位置',
      icon: <MapPin className="w-5 h-5" />,
      description: '中国 · 上海',
      color: 'var(--tech-pink)',
      bgGradient: 'from-tech-pink/10 to-tech-pink/5',
    },
    {
      id: 'timezone',
      title: '时区',
      icon: <Clock className="w-5 h-5" />,
      description: 'UTC+8 (中国标准时间)',
      color: 'var(--warning)',
      bgGradient: 'from-warning/10 to-warning/5',
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
            {/* 分区揭示线：scaleX 由外层 ScrollNarrative 的 GSAP 写入 */}
            <ScrollRevealLine className="mx-auto" />
          </div>
          {/* Stagger 自带 reduced-motion 回退 */}
          <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cards.map((card) => (
              <StaggerItem key={card.id}>
                <HoverLift className="h-full">
                  <div
                    className={`
                      relative group h-full rounded-3xl
                      bg-gradient-to-br ${card.bgGradient}
                      border border-glass-border
                      shadow-[var(--glass-shadow)]
                      hover:shadow-xl
                      backdrop-blur-xl
                      overflow-hidden
                      transition-colors duration-300
                    `}
                    style={{
                      '--card-color': card.color,
                    } as React.CSSProperties}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-background/20 pointer-events-none" />
                    <div className="relative p-6 h-full flex flex-col">
                      <div className="relative mb-4">
                        <motion.div
                          whileHover={{ rotate: 5, scale: 1.1 }}
                          transition={{ duration: 0.2 }}
                          className={`
                            w-12 h-12 rounded-2xl flex items-center justify-center
                            bg-glass
                            shadow-lg
                            group-hover:shadow-xl
                            transition-colors duration-300
                          `}
                          style={{
                            boxShadow: `0 4px 15px -3px color-mix(in srgb, ${card.color} 25%, transparent)`,
                          }}
                        >
                          <div
                            className="transition-colors duration-300"
                            style={{ color: card.color }}
                          >
                            {card.icon}
                          </div>
                        </motion.div>

                        <div
                          className="absolute -inset-2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            background: `radial-gradient(circle, color-mix(in srgb, ${card.color} 20%, transparent) 0%, transparent 70%)`,
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
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:via-[var(--card-color)] transition-[colors,transform] duration-500" />
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-foreground/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-foreground/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  </div>
                </HoverLift>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
