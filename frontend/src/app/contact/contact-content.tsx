'use client';

import { FadeIn } from '@/components/motion';
import ScrollNarrative from '@/components/gsap/ScrollNarrative';
import HeroSection from '@/components/contact/HeroSection';
import ContactCards from '@/components/contact/ContactCards';
import ContactForm from '@/components/contact/ContactForm';
import AvailabilityCard from '@/components/contact/AvailabilityCard';
import FAQAccordion from '@/components/contact/FAQAccordion';

export default function ContactPageContent() {
  return (
    <main className="min-h-screen">
      {/* Hero Section - 渐变背景 */}
      <HeroSection />

      {/* 联系方式卡片 - 透出全站氛围背景；ScrollNarrative 提供分区视差（reduced/移动端静态） */}
      <section className="relative py-16">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-foreground/5 to-transparent dark:via-white/5" />
        <ScrollNarrative>
          <ContactCards />
        </ScrollNarrative>
      </section>

      {/* 联系表单 - 带背景色区分 */}
      <section className="relative py-20 bg-foreground/5">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-tech-cyan/5 to-transparent" />
        <ScrollNarrative>
          <ContactForm />
        </ScrollNarrative>
      </section>
      {/* 在线状态 - 透出全站氛围背景 */}
      <section className="relative py-16">
        <ScrollNarrative>
          <AvailabilityCard />
        </ScrollNarrative>
      </section>

      {/* FAQ - 带背景色区分 */}
      <section className="relative py-20 bg-foreground/5">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-tech-purple/5 to-transparent" />
        <ScrollNarrative>
          <FAQAccordion />
        </ScrollNarrative>
      </section>
      {/* 底部装饰（FadeIn 自带 reduced-motion 回退）- 透出氛围背景，不铺实底 */}
      <FadeIn
        as="section"
        direction="none"
        className="relative py-12 border-t border-foreground/10"
      >
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className="text-white/50 text-sm">
            期待与你的交流
          </p>
        </div>
      </FadeIn>
    </main>
  );
}
