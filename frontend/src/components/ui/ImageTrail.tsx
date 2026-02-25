'use client';

import { gsap } from 'gsap';
import { useEffect, useRef, useState, useCallback } from 'react';

// ============ 工具函数 ============
function lerp(a: number, b: number, n: number): number {
  return (1 - n) * a + n * b;
}

function getLocalPointerPos(e: MouseEvent | TouchEvent, rect: DOMRect): { x: number; y: number } {
  let clientX = 0, clientY = 0;
  if ('touches' in e && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if ('clientX' in e) {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function getMouseDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.hypot(dx, dy);
}

// ============ 图片预加载工具 ============
class ImagePreloader {
  private loadedImages = new Set<string>();
  private pendingPromises = new Map<string, Promise<void>>();

  async preload(urls: string[]): Promise<void> {
    const promises = urls.map(url => this.loadImage(url));
    await Promise.allSettled(promises);
  }

  private loadImage(url: string): Promise<void> {
    if (this.loadedImages.has(url)) {
      return Promise.resolve();
    }

    if (this.pendingPromises.has(url)) {
      return this.pendingPromises.get(url)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.loadedImages.add(url);
        this.pendingPromises.delete(url);
        resolve();
      };
      img.onerror = () => {
        this.pendingPromises.delete(url);
        resolve(); // 即使加载失败也resolve，避免阻塞
      };
      img.src = url;
    });

    this.pendingPromises.set(url, promise);
    return promise;
  }

  clear() {
    this.loadedImages.clear();
    this.pendingPromises.clear();
  }
}

// ============ 页面可见性管理器 ============
class PageVisibilityManager {
  private isHidden = false;
  private callbacks = new Set<() => void>();

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleVisibilityChange() {
    this.isHidden = document.hidden;
    this.callbacks.forEach(cb => cb());
  }

  isVisible(): boolean {
    return !this.isHidden;
  }

  onVisibilityChange(cb: () => void): () => void {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  dispose() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.callbacks.clear();
  }
}

// ============ RAF 循环管理器 ============
class RAFManager {
  private rafIds = new Map<string, number>();
  private paused = false;

  start(key: string, callback: () => void): void {
    if (this.paused) return;
    
    this.stop(key); // 确保同一个key只有一个循环
    
    const loop = () => {
      if (this.paused) return;
      callback();
      const id = requestAnimationFrame(loop);
      this.rafIds.set(key, id);
    };
    
    const id = requestAnimationFrame(loop);
    this.rafIds.set(key, id);
  }

  stop(key: string): void {
    const id = this.rafIds.get(key);
    if (id !== undefined) {
      cancelAnimationFrame(id);
      this.rafIds.delete(key);
    }
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  stopAll(): void {
    this.rafIds.forEach((id) => cancelAnimationFrame(id));
    this.rafIds.clear();
  }

  dispose(): void {
    this.stopAll();
    this.paused = true;
  }
}

// ============ 优化的 ImageItem 类 ============
class ImageItem {
  public DOM: { el: HTMLDivElement; inner: HTMLDivElement | null } = {
    el: null as unknown as HTMLDivElement,
    inner: null
  };
  public defaultStyle: gsap.TweenVars = { scale: 0, x: 0, y: 0, opacity: 0 };
  public rect: DOMRect | null = null;
  private resizeHandler: (() => void) | null = null;
  private isDisposed: boolean = false;

  constructor(DOM_el: HTMLDivElement) {
    this.DOM.el = DOM_el;
    this.DOM.inner = this.DOM.el.querySelector('.content__img-inner');
    
    // 确保初始状态完全隐藏
    gsap.set(this.DOM.el, { 
      opacity: 0, 
      scale: 0,
      x: 0,
      y: 0,
      clearProps: 'transform' 
    });
    
    this.getRect();
    this.initEvents();
  }

  private initEvents() {
    this.resizeHandler = () => {
      if (this.isDisposed) return;
      this.getRect();
    };
    window.addEventListener('resize', this.resizeHandler, { passive: true });
  }

  private getRect() {
    if (this.isDisposed || !this.DOM.el) return;
    this.rect = this.DOM.el.getBoundingClientRect();
  }

  public dispose() {
    if (this.isDisposed) return;
    this.isDisposed = true;
    
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    
    try {
      gsap.killTweensOf(this.DOM.el);
      if (this.DOM.inner) {
        gsap.killTweensOf(this.DOM.inner);
      }
    } catch (e) {
      // 忽略清理错误
    }
    
    try {
      gsap.set(this.DOM.el, { opacity: 0, scale: 0 });
    } catch (e) {
      // 忽略设置错误
    }
  }
}

// ============ 基础动画类 ============
abstract class BaseImageTrail {
  protected container: HTMLDivElement;
  protected images: ImageItem[];
  protected imagesTotal: number;
  protected imgPosition: number;
  protected zIndexVal: number;
  protected activeImagesCount: number;
  protected isIdle: boolean;
  protected threshold: number;
  protected mousePos: { x: number; y: number };
  protected lastMousePos: { x: number; y: number };
  protected cacheMousePos: { x: number; y: number };
  protected isRunning: boolean = false;
  protected rafManager: RAFManager;
  protected visibilityManager: PageVisibilityManager;
  protected handlePointerMove: ((ev: MouseEvent | TouchEvent) => void) | null = null;
  protected handlePointerEnter: ((ev: MouseEvent | TouchEvent) => void) | null = null;
  protected handlePointerLeave: (() => void) | null = null;
  protected isDisposed: boolean = false;
  protected instanceId: string;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.images = Array.from(container.querySelectorAll('.content__img')).map(img => new ImageItem(img as HTMLDivElement));
    this.imagesTotal = this.images.length;
    this.imgPosition = 0;
    this.zIndexVal = 1;
    this.activeImagesCount = 0;
    this.isIdle = true;
    this.threshold = 15;
    this.mousePos = { x: 0, y: 0 };
    this.lastMousePos = { x: 0, y: 0 };
    this.cacheMousePos = { x: 0, y: 0 };
    this.rafManager = new RAFManager();
    this.visibilityManager = new PageVisibilityManager();
    this.instanceId = `trail-${Math.random().toString(36).substr(2, 9)}`;

    this.initEvents();
    this.initVisibilityHandler();
  }

  protected initEvents() {
    this.handlePointerMove = (ev: MouseEvent | TouchEvent) => {
      if (this.isDisposed) return;
      const rect = this.container.getBoundingClientRect();
      this.mousePos = getLocalPointerPos(ev, rect);
      if (!this.isRunning && this.visibilityManager.isVisible()) {
        this.cacheMousePos = { ...this.mousePos };
        this.lastMousePos = { ...this.mousePos };
        this.isRunning = true;
        this.rafManager.start(this.instanceId, () => this.render());
      }
    };

    this.handlePointerEnter = (ev: MouseEvent | TouchEvent) => {
      if (this.isDisposed) return;
      const rect = this.container.getBoundingClientRect();
      this.mousePos = getLocalPointerPos(ev, rect);
      this.cacheMousePos = { ...this.mousePos };
      this.lastMousePos = { ...this.mousePos };
    };

    this.handlePointerLeave = () => {
      // 鼠标离开时不停止，让当前动画完成
    };

    this.container.addEventListener('mousemove', this.handlePointerMove);
    this.container.addEventListener('touchmove', this.handlePointerMove);
    this.container.addEventListener('mouseenter', this.handlePointerEnter);
    this.container.addEventListener('mouseleave', this.handlePointerLeave);
  }

  protected initVisibilityHandler() {
    this.visibilityManager.onVisibilityChange(() => {
      if (!this.visibilityManager.isVisible()) {
        this.rafManager.pause();
      } else {
        this.rafManager.resume();
        if (this.isRunning) {
          this.rafManager.start(this.instanceId, () => this.render());
        }
      }
    });
  }

  protected abstract showNextImage(): void;

  protected render() {
    if (!this.isRunning || this.isDisposed) return;

    const distance = getMouseDistance(this.mousePos, this.lastMousePos);
    
    // 使用更平滑的插值
    this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.25);
    this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.25);

    if (distance > this.threshold) {
      this.showNextImage();
      this.lastMousePos = { ...this.mousePos };
    }
  }

  protected onImageActivated() {
    this.activeImagesCount++;
    this.isIdle = false;
  }

  protected onImageDeactivated() {
    this.activeImagesCount--;
    if (this.activeImagesCount === 0) {
      this.isIdle = true;
    }
  }

  public dispose() {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.isRunning = false;

    this.rafManager.dispose();
    this.visibilityManager.dispose();

    if (this.handlePointerMove) {
      this.container.removeEventListener('mousemove', this.handlePointerMove);
      this.container.removeEventListener('touchmove', this.handlePointerMove);
    }
    if (this.handlePointerEnter) {
      this.container.removeEventListener('mouseenter', this.handlePointerEnter);
    }
    if (this.handlePointerLeave) {
      this.container.removeEventListener('mouseleave', this.handlePointerLeave);
    }

    this.images.forEach(img => img.dispose());
  }
}

// ============ Variant 3 - 相册页面使用 ============
class ImageTrailVariant3 extends BaseImageTrail {
  constructor(container: HTMLDivElement) {
    super(container);
    // 初始化图片状态
    setTimeout(() => {
      this.images.forEach(img => {
        gsap.set(img.DOM.el, { opacity: 0, scale: 0 });
      });
    }, 0);
  }

  protected showNextImage() {
    ++this.zIndexVal;
    this.imgPosition = this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
    const img = this.images[this.imgPosition];

    gsap.killTweensOf(img.DOM.el);
    gsap
      .timeline({
        onStart: () => this.onImageActivated(),
        onComplete: () => this.onImageDeactivated()
      })
      .fromTo(
        img.DOM.el,
        {
          opacity: 0,
          scale: 0,
          zIndex: this.zIndexVal,
          xPercent: 0,
          yPercent: 0,
          x: this.cacheMousePos.x - (img.rect?.width ?? 0) / 2,
          y: this.cacheMousePos.y - (img.rect?.height ?? 0) / 2
        },
        {
          duration: 0.5,
          ease: 'power2.out',
          opacity: 1,
          scale: 1,
          x: this.mousePos.x - (img.rect?.width ?? 0) / 2,
          y: this.mousePos.y - (img.rect?.height ?? 0) / 2
        },
        0
      )
      .fromTo(
        img.DOM.inner,
        { scale: 1.2 },
        {
          duration: 0.5,
          ease: 'power2.out',
          scale: 1
        },
        0
      )
      .to(
        img.DOM.el,
        {
          duration: 0.4,
          ease: 'power2.in',
          opacity: 0,
          scale: 0.2,
          xPercent: () => gsap.utils.random(-30, 30),
          yPercent: -200
        },
        0.5
      );
  }
}

// ============ 其他变体（简化实现） ============
class ImageTrailVariant1 extends BaseImageTrail {
  protected showNextImage() {
    ++this.zIndexVal;
    this.imgPosition = this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
    const img = this.images[this.imgPosition];

    gsap.killTweensOf(img.DOM.el);
    gsap
      .timeline({
        onStart: () => this.onImageActivated(),
        onComplete: () => this.onImageDeactivated()
      })
      .fromTo(
        img.DOM.el,
        {
          opacity: 1,
          scale: 1,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - (img.rect?.width ?? 0) / 2,
          y: this.cacheMousePos.y - (img.rect?.height ?? 0) / 2
        },
        {
          duration: 0.5,
          ease: 'power2.out',
          x: this.mousePos.x - (img.rect?.width ?? 0) / 2,
          y: this.mousePos.y - (img.rect?.height ?? 0) / 2
        },
        0
      )
      .to(
        img.DOM.el,
        {
          duration: 0.4,
          ease: 'power2.in',
          opacity: 0,
          scale: 0.2
        },
        0.5
      );
  }
}

class ImageTrailVariant2 extends BaseImageTrail {
  protected showNextImage() {
    ++this.zIndexVal;
    this.imgPosition = this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
    const img = this.images[this.imgPosition];

    gsap.killTweensOf(img.DOM.el);
    gsap
      .timeline({
        onStart: () => this.onImageActivated(),
        onComplete: () => this.onImageDeactivated()
      })
      .fromTo(
        img.DOM.el,
        {
          opacity: 1,
          scale: 0,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - (img.rect?.width ?? 0) / 2,
          y: this.cacheMousePos.y - (img.rect?.height ?? 0) / 2
        },
        {
          duration: 0.5,
          ease: 'power2.out',
          scale: 1,
          x: this.mousePos.x - (img.rect?.width ?? 0) / 2,
          y: this.mousePos.y - (img.rect?.height ?? 0) / 2
        },
        0
      )
      .fromTo(
        img.DOM.inner,
        { scale: 2.8, filter: 'brightness(250%)' },
        {
          duration: 0.5,
          ease: 'power2.out',
          scale: 1,
          filter: 'brightness(100%)'
        },
        0
      )
      .to(
        img.DOM.el,
        {
          duration: 0.4,
          ease: 'power2.in',
          opacity: 0,
          scale: 0.2
        },
        0.5
      );
  }
}

class ImageTrailVariant4 extends BaseImageTrail {
  protected showNextImage() {
    ++this.zIndexVal;
    this.imgPosition = this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
    const img = this.images[this.imgPosition];

    let dx = this.mousePos.x - this.cacheMousePos.x;
    let dy = this.mousePos.y - this.cacheMousePos.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    if (distance !== 0) {
      dx /= distance;
      dy /= distance;
    }
    dx *= distance / 100;
    dy *= distance / 100;

    gsap.killTweensOf(img.DOM.el);
    gsap
      .timeline({
        onStart: () => this.onImageActivated(),
        onComplete: () => this.onImageDeactivated()
      })
      .fromTo(
        img.DOM.el,
        {
          opacity: 1,
          scale: 0,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - (img.rect?.width ?? 0) / 2,
          y: this.cacheMousePos.y - (img.rect?.height ?? 0) / 2
        },
        {
          duration: 0.5,
          ease: 'power2.out',
          scale: 1,
          x: this.mousePos.x - (img.rect?.width ?? 0) / 2,
          y: this.mousePos.y - (img.rect?.height ?? 0) / 2
        },
        0
      )
      .fromTo(
        img.DOM.inner,
        {
          scale: 2,
          filter: `brightness(${Math.max((400 * distance) / 100, 100)}%) contrast(${Math.max(
            (400 * distance) / 100,
            100
          )}%)`
        },
        {
          duration: 0.5,
          ease: 'power2.out',
          scale: 1,
          filter: 'brightness(100%) contrast(100%)'
        },
        0
      )
      .to(
        img.DOM.el,
        {
          duration: 0.4,
          ease: 'power2.in',
          opacity: 0
        },
        0.5
      )
      .to(
        img.DOM.el,
        {
          duration: 1.5,
          ease: 'power4',
          x: `+=${dx * 110}`,
          y: `+=${dy * 110}`
        },
        0.05
      );
  }
}

class ImageTrailVariant5 extends BaseImageTrail {
  private lastAngle: number = 0;

  protected showNextImage() {
    let dx = this.mousePos.x - this.cacheMousePos.x;
    let dy = this.mousePos.y - this.cacheMousePos.y;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    if (angle > 90 && angle <= 270) angle += 180;
    const isMovingClockwise = angle >= this.lastAngle;
    this.lastAngle = angle;
    let startAngle = isMovingClockwise ? angle - 10 : angle + 10;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance !== 0) {
      dx /= distance;
      dy /= distance;
    }
    dx *= distance / 150;
    dy *= distance / 150;

    ++this.zIndexVal;
    this.imgPosition = this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
    const img = this.images[this.imgPosition];
    gsap.killTweensOf(img.DOM.el);

    gsap
      .timeline({
        onStart: () => this.onImageActivated(),
        onComplete: () => this.onImageDeactivated()
      })
      .fromTo(
        img.DOM.el,
        {
          opacity: 1,
          filter: 'brightness(80%)',
          scale: 0.1,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - (img.rect?.width ?? 0) / 2,
          y: this.cacheMousePos.y - (img.rect?.height ?? 0) / 2,
          rotation: startAngle
        },
        {
          duration: 0.5,
          ease: 'power2.out',
          scale: 1,
          filter: 'brightness(100%)',
          x: this.mousePos.x - (img.rect?.width ?? 0) / 2 + dx * 70,
          y: this.mousePos.y - (img.rect?.height ?? 0) / 2 + dy * 70,
          rotation: this.lastAngle
        },
        0
      )
      .to(
        img.DOM.el,
        {
          duration: 0.4,
          ease: 'power2.in',
          opacity: 0
        },
        0.5
      )
      .to(
        img.DOM.el,
        {
          duration: 1.5,
          ease: 'power4',
          x: `+=${dx * 120}`,
          y: `+=${dy * 120}`
        },
        0.05
      );
  }
}

class ImageTrailVariant6 extends BaseImageTrail {
  protected mapSpeedToSize(speed: number, minSize: number, maxSize: number) {
    const maxSpeed = 100;
    return minSize + (maxSize - minSize) * Math.min(speed / maxSpeed, 1);
  }

  protected mapSpeedToBrightness(speed: number, minB: number, maxB: number) {
    const maxSpeed = 100;
    return minB + (maxB - minB) * Math.min(speed / maxSpeed, 1);
  }

  protected mapSpeedToBlur(speed: number, minBlur: number, maxBlur: number) {
    const maxSpeed = 100;
    return minBlur + (maxBlur - minBlur) * Math.min(speed / maxSpeed, 1);
  }

  protected mapSpeedToGrayscale(speed: number, minG: number, maxG: number) {
    const maxSpeed = 100;
    return minG + (maxG - minG) * Math.min(speed / maxSpeed, 1);
  }

  protected showNextImage() {
    const dx = this.mousePos.x - this.cacheMousePos.x;
    const dy = this.mousePos.y - this.cacheMousePos.y;
    const speed = Math.sqrt(dx * dx + dy * dy);

    ++this.zIndexVal;
    this.imgPosition = this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
    const img = this.images[this.imgPosition];

    const scaleFactor = this.mapSpeedToSize(speed, 0.3, 2);
    const brightnessValue = this.mapSpeedToBrightness(speed, 0, 1.3);
    const blurValue = this.mapSpeedToBlur(speed, 20, 0);
    const grayscaleValue = this.mapSpeedToGrayscale(speed, 600, 0);

    gsap.killTweensOf(img.DOM.el);
    gsap
      .timeline({
        onStart: () => this.onImageActivated(),
        onComplete: () => this.onImageDeactivated()
      })
      .fromTo(
        img.DOM.el,
        {
          opacity: 1,
          scale: 0,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - (img.rect?.width ?? 0) / 2,
          y: this.cacheMousePos.y - (img.rect?.height ?? 0) / 2
        },
        {
          duration: 0.5,
          ease: 'power2.out',
          scale: scaleFactor,
          filter: `grayscale(${grayscaleValue * 100}%) brightness(${brightnessValue * 100}%) blur(${blurValue}px)`,
          x: this.mousePos.x - (img.rect?.width ?? 0) / 2,
          y: this.mousePos.y - (img.rect?.height ?? 0) / 2
        },
        0
      )
      .fromTo(
        img.DOM.inner,
        { scale: 2 },
        {
          duration: 0.5,
          ease: 'power2.out',
          scale: 1
        },
        0
      )
      .to(
        img.DOM.el,
        {
          duration: 0.4,
          ease: 'power2.in',
          opacity: 0,
          scale: 0.2
        },
        0.5
      );
  }
}

function getNewPosition(position: number, offset: number, arr: ImageItem[]) {
  const realOffset = Math.abs(offset) % arr.length;
  if (position - realOffset >= 0) {
    return position - realOffset;
  } else {
    return arr.length - (realOffset - position);
  }
}

class ImageTrailVariant7 extends BaseImageTrail {
  private visibleImagesCount: number = 0;
  private visibleImagesTotal: number;

  constructor(container: HTMLDivElement) {
    super(container);
    this.visibleImagesTotal = 9;
    this.visibleImagesTotal = Math.min(this.visibleImagesTotal, this.imagesTotal - 1);
  }

  protected showNextImage() {
    ++this.zIndexVal;
    this.imgPosition = this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
    const img = this.images[this.imgPosition];
    ++this.visibleImagesCount;

    gsap.killTweensOf(img.DOM.el);
    const scaleValue = gsap.utils.random(0.5, 1.6);

    gsap
      .timeline({
        onStart: () => this.onImageActivated(),
        onComplete: () => this.onImageDeactivated()
      })
      .fromTo(
        img.DOM.el,
        {
          scale: scaleValue - Math.max(gsap.utils.random(0.2, 0.6), 0),
          rotationZ: 0,
          opacity: 1,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - (img.rect?.width ?? 0) / 2,
          y: this.cacheMousePos.y - (img.rect?.height ?? 0) / 2
        },
        {
          duration: 0.5,
          ease: 'power2.out',
          scale: scaleValue,
          rotationZ: gsap.utils.random(-3, 3),
          x: this.mousePos.x - (img.rect?.width ?? 0) / 2,
          y: this.mousePos.y - (img.rect?.height ?? 0) / 2
        },
        0
      );

    if (this.visibleImagesCount >= this.visibleImagesTotal) {
      const lastInQueue = getNewPosition(this.imgPosition, this.visibleImagesTotal, this.images);
      const oldImg = this.images[lastInQueue];
      gsap.to(oldImg.DOM.el, {
        duration: 0.4,
        ease: 'power2.in',
        opacity: 0,
        scale: 1.3,
        onComplete: () => {
          if (this.activeImagesCount === 0) {
            this.isIdle = true;
          }
        }
      });
    }
  }

  protected onImageDeactivated() {
    this.activeImagesCount--;
  }
}

class ImageTrailVariant8 extends BaseImageTrail {
  private rotation: { x: number; y: number } = { x: 0, y: 0 };
  private cachedRotation: { x: number; y: number } = { x: 0, y: 0 };
  private zValue: number = 0;
  private cachedZValue: number = 0;

  protected showNextImage() {
    const rect = this.container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const relX = this.mousePos.x - centerX;
    const relY = this.mousePos.y - centerY;

    this.rotation.x = -(relY / centerY) * 30;
    this.rotation.y = (relX / centerX) * 30;
    this.cachedRotation = { ...this.rotation };

    const distanceFromCenter = Math.sqrt(relX * relX + relY * relY);
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    const proportion = distanceFromCenter / maxDistance;
    this.zValue = proportion * 1200 - 600;
    this.cachedZValue = this.zValue;
    const normalizedZ = (this.zValue + 600) / 1200;
    const brightness = 0.2 + normalizedZ * 2.3;

    ++this.zIndexVal;
    this.imgPosition = this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
    const img = this.images[this.imgPosition];
    gsap.killTweensOf(img.DOM.el);

    gsap
      .timeline({
        onStart: () => this.onImageActivated(),
        onComplete: () => this.onImageDeactivated()
      })
      .set(this.container, { perspective: 1000 }, 0)
      .fromTo(
        img.DOM.el,
        {
          opacity: 1,
          z: 0,
          scale: 1 + this.cachedZValue / 1000,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - (img.rect?.width ?? 0) / 2,
          y: this.cacheMousePos.y - (img.rect?.height ?? 0) / 2,
          rotationX: this.cachedRotation.x,
          rotationY: this.cachedRotation.y,
          filter: `brightness(${brightness})`
        },
        {
          duration: 0.5,
          ease: 'power2.out',
          scale: 1 + this.zValue / 1000,
          x: this.mousePos.x - (img.rect?.width ?? 0) / 2,
          y: this.mousePos.y - (img.rect?.height ?? 0) / 2,
          rotationX: this.rotation.x,
          rotationY: this.rotation.y
        },
        0
      )
      .to(
        img.DOM.el,
        {
          duration: 0.4,
          ease: 'power2.in',
          opacity: 0,
          z: -800
        },
        0.5
      );
  }
}

// ============ 类型定义 ============
type ImageTrailInstance = {
  dispose: () => void;
};

type ImageTrailConstructor =
  | typeof ImageTrailVariant1
  | typeof ImageTrailVariant2
  | typeof ImageTrailVariant3
  | typeof ImageTrailVariant4
  | typeof ImageTrailVariant5
  | typeof ImageTrailVariant6
  | typeof ImageTrailVariant7
  | typeof ImageTrailVariant8;

const variantMap: Record<number, ImageTrailConstructor> = {
  1: ImageTrailVariant1,
  2: ImageTrailVariant2,
  3: ImageTrailVariant3,
  4: ImageTrailVariant4,
  5: ImageTrailVariant5,
  6: ImageTrailVariant6,
  7: ImageTrailVariant7,
  8: ImageTrailVariant8
};

interface ImageTrailProps {
  items?: string[];
  variant?: number;
}

// 全局预加载器
const globalPreloader = new ImagePreloader();

// ============ React 组件 ============
export default function ImageTrail({ items = [], variant = 1 }: ImageTrailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ImageTrailInstance | null>(null);
  const prevItemsRef = useRef<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  // 比较两个数组是否相等（比较元素的URL）
  const areArraysEqual = useCallback((arr1: string[], arr2: string[]) => {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((url, i) => url === arr2[i]);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const itemsChanged = !areArraysEqual(prevItemsRef.current, items);
    
    if (itemsChanged && items.length > 0) {
      // 清理旧实例
      if (instanceRef.current) {
        instanceRef.current.dispose();
        instanceRef.current = null;
      }

      prevItemsRef.current = [...items];
      
      // 预加载图片
      globalPreloader.preload(items).then(() => {
        setIsReady(true);
        
        // 等待下一帧确保DOM已更新
        requestAnimationFrame(() => {
          if (!containerRef.current) return;
          
          const Cls = variantMap[variant] || variantMap[1];
          const instance = new Cls(containerRef.current) as ImageTrailInstance;
          instanceRef.current = instance;
        });
      });
    }

    return () => {
      // 组件卸载时清理
    };
  }, [variant, items, areArraysEqual]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        instanceRef.current.dispose();
        instanceRef.current = null;
      }
      prevItemsRef.current = [];
      setIsReady(false);
    };
  }, []);

  return (
    <div 
      className="w-full h-full relative z-[20] rounded-lg bg-transparent overflow-visible" 
      ref={containerRef}
      style={{ pointerEvents: 'auto' }}
    >
      {items.map((url, i) => (
        <div
          className="content__img w-[280px] aspect-[1.1] rounded-[15px] absolute top-0 left-0 overflow-hidden"
          key={`img-${i}`}
          style={{ 
            willChange: 'transform, opacity',
            opacity: isReady ? 0 : 0 
          }}
        >
          <div
            className="content__img-inner bg-center bg-cover w-[calc(100%+20px)] h-[calc(100%+20px)] absolute top-[-10px] left-[-10px]"
            style={{ backgroundImage: `url(${url})` }}
          />
        </div>
      ))}
    </div>
  );
}
