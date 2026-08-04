/**
 * 占卜视图顶部静态月相装饰：月牙 + 星点 + 两侧渐隐细线。
 * 低透明度、pointer-events-none、token 色——氛围点缀，不抢「哇点」。
 */
export default function TarotOrnament() {
  return (
    <div
      aria-hidden
      className="pointer-events-none mx-auto mb-8 flex w-full max-w-xl select-none items-center gap-5 text-tech-purple/30"
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-tech-purple/40" />
      <svg viewBox="0 0 64 32" className="h-6 w-12" fill="none" stroke="currentColor" strokeWidth={2}>
        {/* 左侧小星 */}
        <path d="M10 8 v6 M7 11 h6" strokeLinecap="round" />
        {/* 月牙 */}
        <path d="M40 6 A12 12 0 0 0 40 26 A9.5 9.5 0 0 1 40 6 Z" strokeLinejoin="round" />
        {/* 右侧小星 */}
        <path d="M56 20 v5 M53.5 22.5 h5" strokeLinecap="round" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-tech-purple/40" />
    </div>
  );
}
