'use client';
import { useState } from 'react';
import { Share2Icon, CopyIcon, CheckIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { TwitterIcon, LinkedinIcon, MailIcon } from '../icons/SocialIcons';
interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}
export default function SocialShare({ url, title, description, className = '' }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const shareOptions = [
    {
      name: 'Twitter',
      icon: <TwitterIcon size={16} />,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
    },
    {
      name: 'LinkedIn',
      icon: <LinkedinIcon size={16} />,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    },
    {
      name: 'Email',
      icon: <MailIcon size={16} />,
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description || '')}%20${encodeURIComponent(url)}`
    }
  ];
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url
        });
      } catch {
      }
    } else {
      // 降级到复制链接
      copyToClipboard();
    }
  };
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Button
        variant="glass"
        size="sm"
        onClick={handleShare}
        className="flex items-center gap-2"
        aria-label="分享文章"
      >
        <Share2Icon size={16} />
        分享
      </Button>
      {shareOptions.map((option) => (
        <a
          key={option.name}
          href={option.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full bg-glass border border-glass-border hover:bg-glass-border/20 transition-colors"
          aria-label={`分享到${option.name}`}
        >
          {option.icon}
        </a>
      ))}
      <Button
        variant="glass"
        size="sm"
        onClick={copyToClipboard}
        className="flex items-center gap-2"
        aria-label={copied ? "链接已复制" : "复制链接"}
      >
        {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
        {copied ? "已复制!" : "复制"}
      </Button>
    </div>
  );
}