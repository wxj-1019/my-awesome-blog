'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * GSAP 插件注册（幂等，仅客户端）。
 * L3/L4 组件在 useGSAP 前调用 ensureGsapPlugins()。
 */

let registered = false;

export function ensureGsapPlugins(): typeof gsap {
  if (typeof window !== 'undefined' && !registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return gsap;
}

export { ScrollTrigger };

/** 测试或 HMR 场景下重置（一般业务代码勿调用） */
export function __resetGsapRegistryForTests(): void {
  registered = false;
}
