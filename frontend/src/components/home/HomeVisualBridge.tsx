'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

const bridgeNodes = [
  { label: '01', className: 'left-[12%] top-[34%]' },
  { label: '02', className: 'left-[34%] top-[58%]' },
  { label: '03', className: 'left-[62%] top-[28%]' },
  { label: '04', className: 'left-[82%] top-[62%]' },
]

export default function HomeVisualBridge() {
  const bridgeRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const root = bridgeRef.current
      if (!root) {
        return
      }

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const targets = gsap.utils.toArray<HTMLElement>('[data-bridge-animate]', root)

      if (reduceMotion) {
        gsap.set(targets, { autoAlpha: 1, y: 0, scale: 1 })
        return
      }

      gsap.set(targets, { autoAlpha: 0, y: 18, scale: 0.96 })
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .to(targets, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.08,
        })
        .fromTo(
          '[data-bridge-scan]',
          { xPercent: -120, autoAlpha: 0 },
          { xPercent: 120, autoAlpha: 0.75, duration: 1.4, ease: 'power2.inOut' },
          0.12
        )
    },
    { scope: bridgeRef }
  )

  return (
    <section
      ref={bridgeRef}
      aria-label="home-visual-bridge"
      className="relative overflow-hidden bg-background py-8 sm:py-10 lg:py-12"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-tech-cyan/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-tech-sky/40 to-transparent" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(6,182,212,.45)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,.45)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div
          data-bridge-scan
          className="absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-tech-cyan/20 to-transparent blur-xl"
        />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto h-28 max-w-5xl sm:h-32 lg:h-36">
          <div
            data-bridge-animate
            className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-tech-cyan/60 to-transparent"
          />
          <div
            data-bridge-animate
            className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-tech-sky/40 to-transparent"
          />

          {bridgeNodes.map((node) => (
            <div
              key={node.label}
              data-bridge-animate
              className={`absolute ${node.className} hidden sm:block`}
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
