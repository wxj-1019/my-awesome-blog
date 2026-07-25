/**
 * 深邃星空 canvas 渲染器（深色主题全局背景）。
 * 无 React 依赖；由 AmbientBackground 在 useEffect 中挂载。
 * 元素：底色渐变 + 三层星（远/中/近）+ 慢流星 + 旋臂星系 + 紫蓝星云 + 上浮微尘。
 */

export interface StarfieldOptions {
  reducedMotion?: boolean;
}

interface Star {
  x: number; y: number; r: number; tw: number; ts: number;
}
interface Meteor {
  x: number; y: number; len: number; sp: number; life: number; max: number;
}
interface Dust {
  x: number; y: number; r: number; sp: number; a: number; ph: number;
}

const STAR_COUNTS = { far: 75, mid: 42, near: 18 };
const DUST_COUNT = 22;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function makeStars(n: number, w: number, h: number, rMin: number, rMax: number): Star[] {
  const arr: Star[] = [];
  for (let i = 0; i < n; i++) {
    arr.push({
      x: rand(0, w), y: rand(0, h),
      r: rand(rMin, rMax),
      tw: rand(0, Math.PI * 2), ts: rand(0.5, 2),
    });
  }
  return arr;
}

function makeDust(w: number, h: number): Dust[] {
  const arr: Dust[] = [];
  for (let i = 0; i < DUST_COUNT; i++) {
    arr.push({
      x: rand(0, w), y: rand(0, h),
      r: rand(0.4, 1), sp: rand(0.08, 0.2),
      a: rand(0.15, 0.35), ph: rand(0, Math.PI * 2),
    });
  }
  return arr;
}

export interface Starfield {
  start(): void;
  stop(): void;
  resize(): void;
  drawStatic(): void;
}

export function createStarfield(
  canvas: HTMLCanvasElement,
  options: StarfieldOptions = {},
): Starfield {
  const ctx = canvas.getContext('2d');
  const reduced = options.reducedMotion ?? false;
  let rafId = 0;
  let running = false;
  let t = 0;
  let W = 0;
  let H = 0;
  let far: Star[] = [];
  let mid: Star[] = [];
  let near: Star[] = [];
  let dust: Dust[] = [];
  const meteors: Meteor[] = [];

  function fitSize(): void {
    const dpr = Math.max(1, Math.min(2, (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1));
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    if (ctx) {ctx.setTransform(dpr, 0, 0, dpr, 0, 0);}
  }

  function rebuild(): void {
    fitSize();
    far = makeStars(STAR_COUNTS.far, W, H, 0.5, 1.1);
    mid = makeStars(STAR_COUNTS.mid, W, H, 0.8, 1.7);
    near = makeStars(STAR_COUNTS.near, W, H, 1.2, 2.6);
    dust = makeDust(W, H);
  }

  function drawBackground(): void {
    if (!ctx) {return;}
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#040816');
    g.addColorStop(1, '#0a1228');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawStars(stars: Star[], baseColor: string): void {
    if (!ctx) {return;}
    for (const s of stars) {
      const a = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.02 * s.ts + s.tw));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${baseColor},${a})`;
      ctx.fill();
    }
  }

  function spawnMeteor(): void {
    meteors.push({
      x: rand(0, W), y: rand(0, H * 0.45),
      len: rand(70, 110), sp: rand(0.6, 0.9),
      life: 0, max: rand(180, 220),
    });
  }

  function drawMeteors(): void {
    if (!ctx || reduced) {return;}
    if (Math.random() < 0.0035 && meteors.length < 1) {spawnMeteor();}
    for (const m of meteors) {
      m.life++;
      m.x -= m.sp * 2;
      m.y += m.sp * 0.55;
      const fade = m.life < 20 ? m.life / 20 : m.life > m.max - 30 ? (m.max - m.life) / 30 : 1;
      const grad = ctx.createLinearGradient(m.x, m.y, m.x + m.len, m.y - m.len * 0.28);
      grad.addColorStop(0, `rgba(255,255,255,${0.85 * fade})`);
      grad.addColorStop(0.4, `rgba(210,225,255,${0.4 * fade})`);
      grad.addColorStop(1, 'rgba(200,210,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x + m.len, m.y - m.len * 0.28);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(m.x, m.y, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${fade})`;
      ctx.fill();
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      if (meteors[i].life >= meteors[i].max) {meteors.splice(i, 1);}
    }
  }

  function drawGalaxy(): void {
    if (!ctx) {return;}
    const cx = W * 0.72;
    const cy = H * 0.68;
    const R = Math.min(W, H) * 0.22;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let arm = 0; arm < 2; arm++) {
      for (let i = 0; i < 60; i++) {
        const f = i / 60;
        const ang = f * Math.PI * 3 + arm * Math.PI + t * 0.0008;
        const rr = R * (0.15 + f * 0.85);
        const x = cx + Math.cos(ang) * rr + Math.sin(ang * 2) * 4;
        const y = cy + Math.sin(ang) * rr * 0.55;
        const a = 0.06 * (1 - f) * 0.7;
        ctx.beginPath();
        ctx.arc(x, y, 0.8 + f * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(190,205,255,${a})`;
        ctx.fill();
      }
    }
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.4);
    rg.addColorStop(0, 'rgba(220,225,255,0.10)');
    rg.addColorStop(1, 'rgba(220,225,255,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawNebula(): void {
    if (!ctx) {return;}
    const clouds = [
      { x: 0.2, y: 0.3, r: 90, c: '120,90,200' },
      { x: 0.45, y: 0.55, r: 110, c: '70,110,190' },
    ];
    for (let i = 0; i < clouds.length; i++) {
      const cl = clouds[i];
      const ph = Math.sin(t * 0.003 + i);
      const cx = cl.x * W + Math.cos(t * 0.002 + i) * 14;
      const cy = cl.y * H + Math.sin(t * 0.0025 + i) * 10;
      const a = 0.06 + 0.03 * (0.5 + 0.5 * ph);
      const rad = Math.max(20, cl.r + ph * 10);
      const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      rg.addColorStop(0, `rgba(${cl.c},${a})`);
      rg.addColorStop(1, `rgba(${cl.c},0)`);
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawDust(): void {
    if (!ctx || reduced) {return;}
    for (const d of dust) {
      d.y -= d.sp;
      if (d.y < -4) {d.y = H + 4;}
      const x = d.x + Math.sin(t * 0.01 + d.ph) * 6;
      ctx.beginPath();
      ctx.arc(x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,215,255,${d.a})`;
      ctx.fill();
    }
  }

  function frame(): void {
    if (!ctx) {return;}
    t++;
    drawBackground();
    drawStars(far, '230,235,255');
    drawStars(mid, '230,235,255');
    drawStars(near, '200,210,255');
    drawNebula();
    drawGalaxy();
    drawMeteors();
    drawDust();
    if (running) {rafId = requestAnimationFrame(frame);}
  }

  function drawStatic(): void {
    if (!ctx) {return;}
    t = 0;
    if (W === 0) {rebuild();}
    drawBackground();
    // 静态中等亮度
    for (const s of [...far, ...mid, ...near]) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230,235,255,0.6)`;
      ctx.fill();
    }
    drawNebula();
    drawGalaxy();
  }

  return {
    start() {
      if (running) {return;}
      if (W === 0) {rebuild();}
      running = true;
      if (reduced) {
        drawStatic();
        running = false;
        return;
      }
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      if (rafId) {cancelAnimationFrame(rafId);}
      rafId = 0;
    },
    resize() {
      rebuild();
    },
    drawStatic() {
      drawStatic();
    },
  };
}
