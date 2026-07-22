'use client';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-border/40 bg-transparent py-4 backdrop-blur-[2px]">
      <p className="text-muted-foreground text-sm text-center">
        © {currentYear} 我的优秀博客. 保留所有权利。
      </p>
    </footer>
  );
}
