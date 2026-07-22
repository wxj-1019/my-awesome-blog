'use client';
import { useState } from 'react';
import { motion } from '@/lib/framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Stagger, StaggerItem, FadeIn } from '@/components/motion';
import { ScrollRevealLine } from '@/components/gsap/ScrollNarrative';
import { cn } from '@/lib/utils';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}
const faqItems: FAQItem[] = [
  {
    id: '1',
    question: '我通常在多长时间内回复消息？',
    answer: '在工作日的 09:00 - 18:00 (UTC+8) 期间，我通常会在 2 小时内回复消息。在非工作时间或周末，回复时间可能延长到下一个工作日。紧急事项请通过社交媒体联系。',
  },
  {
    id: '2',
    question: '我可以咨询哪些类型的问题？',
    answer: '我乐于回答关于前端开发、React、Next.js、TypeScript 等技术问题，也可以讨论项目合作、工作机会或简单的闲聊。如果有商务合作需求，请在邮件中详细说明。',
  },
  {
    id: '3',
    question: '如何才能更快地得到回复？',
    answer: '在消息中清晰说明你的问题和需求，我会更容易快速理解和回复。紧急事项建议通过 Twitter 或 LinkedIn 联系，我会优先处理这些渠道的消息。',
  },
  {
    id: '4',
    question: '我可以分享你的联系方式给他人吗？',
    answer: '当然可以！如果你认为我的技能或经验对其他人有帮助，欢迎分享我的联系方式。不过请告知我，这样我也能提前了解可能的咨询内容。',
  },
  {
    id: '5',
    question: '你对合作项目有什么要求？',
    answer: '我对合作项目持开放态度，主要考虑项目的创新性、技术挑战性以及时间安排。如果有合作意向，请发送邮件详细描述项目内容、时间要求和预算范围。',
  },
  {
    id: '6',
    question: '我可以在哪里看到你的作品和项目？',
    answer: '你可以在我的 GitHub 主页查看开源项目，在网站上查看我的作品集，也可以关注我的 Twitter 获取最新动态。这些渠道都有链接在页面上方。',
  },
];
export default function FAQAccordion() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };
  return (
    <section className="w-full py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="font-sf-pro-display text-3xl font-bold text-foreground mb-2">
              常见问题
            </h2>
            <p className="font-sf-pro-text text-foreground/70">
              你可能想了解的事情
            </p>
            {/* 分区揭示线：scaleX 由外层 ScrollNarrative 的 GSAP 写入 */}
            <ScrollRevealLine className="mx-auto" />
          </div>
          {/* Stagger 自带 reduced-motion 回退 */}
          <Stagger className="space-y-4" stagger={0.05}>
            {faqItems.map((item) => {
              const isOpen = openItems.has(item.id);
              return (
                <StaggerItem key={item.id}>
                  <GlassCard padding="none">
                    <motion.button
                      onClick={() => toggleItem(item.id)}
                      className="w-full p-6 flex items-start gap-4 text-left"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-tech-cyan/10 flex items-center justify-center flex-shrink-0">
                        <HelpCircle className="w-5 h-5 text-tech-cyan" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="font-sf-pro-display font-semibold text-foreground text-lg">
                            {item.question}
                          </h3>
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex-shrink-0"
                          >
                            <ChevronDown className="w-5 h-5 text-foreground/40" />
                          </motion.div>
                        </div>
                      </div>
                    </motion.button>
                    {/* 展开动画：grid-rows 0fr→1fr + opacity，不触发布局属性动画 */}
                    <div
                      className={cn(
                        'grid transition-[grid-template-rows] duration-300 ease-out',
                        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      )}
                    >
                      <div className="overflow-hidden min-h-0">
                        <div
                          className={cn(
                            'px-6 pb-6 pl-20 transition-opacity duration-300',
                            isOpen ? 'opacity-100' : 'opacity-0'
                          )}
                        >
                          <p className="font-sf-pro-text text-foreground/70 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </StaggerItem>
              );
            })}
          </Stagger>
          <FadeIn delay={0.4} className="mt-8 text-center">
            <p className="font-sf-pro-text text-foreground/60">
              没有找到你的问题？<a href="mailto:contact@example.com" className="text-tech-cyan hover:underline">直接发邮件给我</a>
            </p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
