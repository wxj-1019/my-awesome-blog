import { fireEvent, render, screen } from '@testing-library/react';
import Lightbox from '@/components/ui/Lightbox';

jest.mock('@/lib/framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
    // eslint-disable-next-line jsx-a11y/alt-text -- alt 由组件经 props 传入，测试中始终有值
    img: (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...p} />,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

const images = [
  { id: '1', src: 'https://cdn.example.com/a.png', alt: '图A' },
  { id: '2', src: 'https://cdn.example.com/b.png', alt: '图B' },
];

describe('Lightbox · 可访问灯箱', () => {
  it('打开时获得 dialog 语义，Esc 触发 onClose', () => {
    const onClose = jest.fn();
    render(
      <Lightbox
        images={images}
        currentIndex={0}
        isOpen
        onClose={onClose}
        enableZoom={false}
        enableRotate={false}
        enableShare={false}
      />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('切换图片后恢复缩放状态', () => {
    const onNext = jest.fn();
    render(
      <Lightbox
        images={images}
        currentIndex={0}
        isOpen
        onClose={jest.fn()}
        onNext={onNext}
        enableShare={false}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '放大' }));
    fireEvent.click(screen.getByRole('button', { name: '下一张图片' }));
    expect(screen.getByText(/2 \/ 2/)).toBeInTheDocument();
    expect(screen.getByText('1.0x')).toBeInTheDocument();
  });
});
