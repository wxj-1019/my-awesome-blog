'use client';

import FriendLinkCard from '@/components/ui/FriendLinkCard';

interface FriendLink {
  id: string;
  name: string;
  url: string;
  favicon: string;
  description?: string;
}

interface FriendLinksProps {
  links: FriendLink[];
}

export default function FriendLinks({ links }: FriendLinksProps) {
  if (!links || links.length === 0) {
    return null;
  }

  return (
    <section className="py-4 lg:py-6">
      <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 animate-fade-in-up">
        友情链接
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <FriendLinkCard
                className="flex flex-row items-center justify-start px-3 py-2.5"
                hoverEffect={true}
                glowEffect={true}
                padding="none"
                cornerAnimation={true}
              >
                <img
                  src={link.favicon}
                  alt={link.name}
                  className="w-8 h-8 sm:w-9 sm:h-9 mr-2.5 group-hover:scale-110 transition-transform duration-300"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-foreground font-medium text-sm mb-0.5 truncate group-hover:text-tech-cyan transition-colors">
                    {link.name}
                  </h4>

                  {link.description && (
                    <p className="text-muted-foreground text-[10px] sm:text-xs truncate">{link.description}</p>
                  )}
                </div>
              </FriendLinkCard>
            </a>
        ))}
      </div>
    </section>
  );
}