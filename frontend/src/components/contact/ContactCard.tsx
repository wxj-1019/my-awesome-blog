'use client';

import { ExternalLink } from 'lucide-react';
import { FadeIn } from '@/components/motion';

interface ContactCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  delay?: number;
}

function ContactCard({ icon, title, description, href, onClick, delay = 0 }: ContactCardProps) {
  const content = (
    <div className="group relative">
      <div className="absolute inset-0 bg-glass backdrop-blur-xl border border-glass-border rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:border-primary/40">
        <div className="flex items-start gap-4 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-tech-purple rounded-xl flex items-center justify-center text-primary-foreground shadow-lg group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        {href && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <FadeIn delay={delay}>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block cursor-pointer"
        >
          {content}
        </a>
      ) : onClick ? (
        <button
          onClick={onClick}
          className="w-full cursor-pointer"
        >
          {content}
        </button>
      ) : (
        <div>{content}</div>
      )}
    </FadeIn>
  );
}

interface ContactCardsProps {
  cards: Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
    href?: string;
    onClick?: () => void;
  }>;
}

export default function ContactCards({ cards }: ContactCardsProps) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-foreground mb-6 px-1">
        热门联系主题
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <ContactCard key={card.title} {...card} delay={index * 0.1} />
        ))}
      </div>
    </section>
  );
}
