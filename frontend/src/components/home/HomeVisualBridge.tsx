'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { ensureGsapPlugins } from '@/lib/gsap/registry'
import { SCROLL_VIEWPORT } from '@/lib/gsap/scroll-presets'
import BubbleField from './BubbleField'

const bridgeNodes = [
  { label: '01', className: 'left-[12%] top-[34%]' },
  { label: '02', className: 'left-[34%] top-[58%]' },
  { label: '03', className: 'left-[62%] top-[28%]' },
  { label: '04', className: 'left-[82%] top-[62%]' },
]

/** Phase 2：设 NEXT_PUBLIC_MOTION_L3=0 时仅保留入场、不做 scrub */
const MOTION_L3_ENABLED = process.env.NEXT_PUBLIC_MOTION_L3 !== '0'

export default function HomeVisualBridge() {
  const bridgeRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const root = bridgeRef.current
      if (!root) {
        return
      }

      const gsap = ensureGsapPlugins()
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const isDesktop = window.matchMedia('(min-width: 768px)').matches
      const targets = gsap.utils.toArray<HTMLElement>('[data-bridge-animate]', root)
      const scan = root.querySelector<HTMLElement>('[data-bridge-scan]')

      if (reduceMotion) {
        gsap.set(targets, { autoAlpha: 1, y: 0, scale: 1 })
        if (scan) {
          gsap.set(scan, { autoAlpha: 0 })
        }
        return
      }

      // 入场（所有断点）：轻量 timeline，无 pin
      gsap.set(targets, { autoAlpha: 0, y: 18, scale: 0.96 })
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
      intro.to(targets, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.08,
      })

      if (scan) {
        intro.fromTo(
          scan,
          { xPercent: -120, autoAlpha: 0 },
          { xPercent: 120, autoAlpha: 0.75, duration: 1.4, ease: 'power2.inOut' },
          0.12
        )
      }

      // L3 桌面 scrub：仅水平线 / 竖线轻位移（不 pin，符合预算 pin≤1 且本段不用 pin）
      if (MOTION_L3_ENABLED && isDesktop) {
        const lines = gsap.utils.toArray<HTMLElement>(
          '[data-bridge-line]',
          root
        )
        lines.forEach((line, index) => {
          gsap.fromTo(
            line,
            { scaleX: index % 2 === 0 ? 0.85 : 1, transformOrigin: 'center center' },
            {
              scaleX: index % 2 === 0 ? 1.05 : 0.9,
              ease: 'none',
              scrollTrigger: {
                trigger: root,
                ...SCROLL_VIEWPORT.SCRUB,
              },
            }
          )
        })

        const nodes = gsap.utils.toArray<HTMLElement>('[data-bridge-node]', root)
        gsap.fromTo(
          nodes,
          { y: 12 },
          {
            y: -12,
            ease: 'none',
            stagger: 0.04,
            scrollTrigger: {
              trigger: root,
              ...SCROLL_VIEWPORT.SCRUB,
            },
          }
        )
      }
    },
    { scope: bridgeRef, dependencies: [] }
  )

  return (
    <section
      ref={bridgeRef}
      aria-label="home-visual-bridge"
      data-motion-l3={MOTION_L3_ENABLED ? 'on' : 'off'}
      // 顶部留白让 hero 波浪可以压上来不被截断；overflow-x 仍隐藏网格扫描
      className="relative overflow-x-hidden bg-background pt-20 sm:pt-24 lg:pt-28 pb-8 sm:pb-10 lg:pb-12"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* 顶部流光：与 hero 波浪衔接，像水面延伸下来的光带 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-tech-cyan/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-tech-sky/40 to-transparent" />
        {/* 顶部柔光：从波浪过渡到 bridge 背景，避免硬接 */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-tech-cyan/[0.06] to-transparent" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(6,182,212,.45)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,.45)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div
          data-bridge-scan
          className="absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-tech-cyan/20 to-transparent blur-xl"
        />
        {/* 节点呼吸光晕：呼应浪尖反光 */}
        <div className="absolute left-[12%] top-[34%] h-24 w-24 -translate-x-1/2 rounded-full bg-tech-cyan/10 blur-2xl animate-pulse-slow" />
        <div className="absolute left-[62%] top-[28%] h-24 w-24 -translate-x-1/2 rounded-full bg-tech-sky/10 blur-2xl animate-pulse-slow" style={{ animationDelay: '1.2s' }} />
        {/* 气泡延伸：从 hero 波浪继续上浮到 bridge 中部，形成「水中上升」连续感 */}
        <BubbleField count={10} className="h-full" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto h-28 max-w-5xl sm:h-32 lg:h-36">
          <div
            data-bridge-animate
            data-bridge-line
            className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-tech-cyan/60 to-transparent will-change-transform"
          />
          <div
            data-bridge-animate
            data-bridge-line
            className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-tech-sky/40 to-transparent will-change-transform"
          />

          {bridgeNodes.map((node) => (
            <div
              key={node.label}
              data-bridge-animate
              data-bridge-node
              className={`absolute ${node.className} hidden sm:block will-change-transform`}
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-tech-cyan/40 bg-glass/30 text-[10px] font-semibold text-tech-cyan shadow-[0_0_24px_rgba(6,182,212,.22)] backdrop-blur-xl">
                <span>{node.label}</span>
                <span className="absolute inset-[-6px] rounded-full border border-tech-cyan/15" />
              </div>
            </div>
          ))}

          <div
            data-bridge-animate
            className="absolute inset-x-4 top-1/2 mx-auto flex max-w-2xl -translate-y-1/2 items-center justify-center"
          >
            <div className="rounded-full border border-glass-border bg-glass/30 px-4 py-2 text-center text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground shadow-macos-glass-1 backdrop-blur-xl sm:text-sm">
              Signal locked / Content stream online
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
