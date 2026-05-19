// Probability scene：随机游走（布朗运动）
// 数学语义：每一步是一次抽样，看不见的分布在背后
// anchor 偏左下——和 analysis 的居中、linalg 的右下形成 anchor 漂移

import type { SceneSpec, SceneCtx } from './types';
import { rgba } from './types';

interface Walker {
  path: Array<{ x: number; y: number }>;
  hue: number;
  speed: number;
}

// 模块级状态（浏览器端跨帧保留）
let walkers: Walker[] = [];
let lastStepTime = 0;
const WALKER_COUNT = 5;
const MAX_PATH_LEN = 90;

function anchorCenter(sctx: SceneCtx): { ax: number; ay: number; range: number } {
  const ax = sctx.width * 0.32;
  const ay = sctx.height * 0.55;
  const range = Math.min(sctx.width, sctx.height) * 0.28;
  return { ax, ay, range };
}

function ensureWalkers(sctx: SceneCtx) {
  if (walkers.length === WALKER_COUNT && walkers[0]?.path.length > 0) return;
  const { ax, ay } = anchorCenter(sctx);
  walkers = Array.from({ length: WALKER_COUNT }, (_, i) => ({
    path: [{ x: ax, y: ay }],
    hue: i / WALKER_COUNT,
    speed: 0.8 + (i / WALKER_COUNT) * 0.6,
  }));
  lastStepTime = sctx.time;
}

function stepWalkers(sctx: SceneCtx) {
  if (sctx.time - lastStepTime < 80) return;
  lastStepTime = sctx.time;

  const { ax, ay, range } = anchorCenter(sctx);

  for (const w of walkers) {
    const last = w.path[w.path.length - 1];
    // Box-Muller 高斯随机
    const u1 = Math.max(1e-6, Math.random());
    const u2 = Math.random();
    const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const z2 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
    const stepSize = 14 * w.speed;
    let nx = last.x + z1 * stepSize * 0.4;
    let ny = last.y + z2 * stepSize * 0.4;

    // 软边界：超出 range 时向 anchor 拉回
    const dist = Math.hypot(nx - ax, ny - ay);
    if (dist > range) {
      const angle = Math.atan2(ay - ny, ax - nx);
      const pullback = (dist - range) * 0.6;
      nx += Math.cos(angle) * pullback;
      ny += Math.sin(angle) * pullback;
    }

    w.path.push({ x: nx, y: ny });
    if (w.path.length > MAX_PATH_LEN) w.path.shift();
  }
}

// Bell curve（标准正态密度函数）
function gaussian(x: number, mu = 0, sigma = 1): number {
  const norm = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const exponent = -0.5 * ((x - mu) / sigma) ** 2;
  return norm * Math.exp(exponent);
}

export const probabilityScene: SceneSpec = {
  id: 'probability',
  anchor: { x: 0.32, y: 0.55 },
  sysInfo: {
    space: 'sample · X ~ P',
    status: 'status · sampling',
    object: 'object · trajectories',
  },
  copy: {
    glyph: '∝',
    sectionLabel: 'iii. probability',
    italicCopy: '每一步是一次抽样，\n看不见的分布在背后——\n期望存在，\n但每条路径都偏离它。',
    sideNote: 'X ~ N(μ, σ²)\nE[X], Var[X]',
  },

  getScreenAnchor: (sctx) => ({
    x: sctx.width * 0.72,
    y: sctx.height * 0.45,
  }),

  layout: (points, sctx) => {
    const { ax, ay, range } = anchorCenter(sctx);
    ensureWalkers(sctx);
    stepWalkers(sctx);

    // 用 walker 当前位置作为 5 个点的 target
    points.forEach((p, i) => {
      if (i < walkers.length) {
        const path = walkers[i].path;
        const last = path[path.length - 1];
        p.targetX = last.x;
        p.targetY = last.y;
        p.role = 'walker';
        p.meta = { walkerIndex: i };
      } else {
        // 其他点在 anchor 周围漂浮（散点样本感）
        const radius = range * 0.7 * Math.sqrt((i - walkers.length) / (points.length - walkers.length));
        const angle = (i * 137.5) * (Math.PI / 180); // 黄金角散布
        p.targetX = ax + Math.cos(angle) * radius;
        p.targetY = ay + Math.sin(angle) * radius;
        p.role = 'sample';
        p.meta = {};
      }
    });
  },

  drawLayers: (ctx, points, sctx) => {
    const { color, ink, time } = sctx;
    const { ax, ay, range } = anchorCenter(sctx);

    // 1. 软范围圆（采样范围）
    ctx.strokeStyle = rgba(ink, 0.08);
    ctx.setLineDash([2, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ax, ay, range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. 正态分布密度曲线（横向，在 anchor 下方）
    const curveBaseY = ay + range * 0.95;
    const curveHeight = range * 0.45;
    const sigma = 1;
    const peak = gaussian(0, 0, sigma);
    ctx.strokeStyle = rgba(color, 0.36);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let px = -range; px <= range; px += 4) {
      const xNorm = px / (range * 0.5);
      const y = gaussian(xNorm, 0, sigma) / peak;
      const screenX = ax + px;
      const screenY = curveBaseY - y * curveHeight;
      if (px === -range) ctx.moveTo(screenX, screenY);
      else ctx.lineTo(screenX, screenY);
    }
    ctx.stroke();

    // 3. 中心垂直线（μ）
    ctx.strokeStyle = rgba(color, 0.2);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ax, curveBaseY);
    ctx.lineTo(ax, curveBaseY - curveHeight * 1.05);
    ctx.stroke();

    // 4. 走廊：每条 walker 的轨迹
    for (const w of walkers) {
      ctx.lineWidth = 1.2;
      const len = w.path.length;
      for (let i = 1; i < len; i += 1) {
        const a = w.path[i - 1];
        const b = w.path[i];
        const fade = i / len; // 越靠后越亮
        const alpha = fade * 0.55;
        ctx.strokeStyle = rgba(color, alpha);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      // 头部光晕
      const head = w.path[len - 1];
      if (head) {
        const grad = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 8);
        grad.addColorStop(0, rgba(color, 0.55));
        grad.addColorStop(1, rgba(color, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. 起点（anchor 处）
    ctx.fillStyle = rgba(ink, 0.55);
    ctx.beginPath();
    ctx.arc(ax, ay, 3, 0, Math.PI * 2);
    ctx.fill();
  },

  annotate: (ctx, points, sctx) => {
    const { color, ink } = sctx;
    const { ax, ay, range } = anchorCenter(sctx);
    const curveBaseY = ay + range * 0.95;

    // μ 标注
    ctx.font = 'italic 11px "Cormorant Garamond", serif';
    ctx.fillStyle = rgba(color, 0.5);
    ctx.fillText('μ', ax - 4, curveBaseY + 14);

    // anchor 处标 X₀（起点）
    ctx.fillText('X₀', ax + 8, ay - 6);

    // walker 头部坐标抽样
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.fillStyle = rgba(ink, 0.42);
    for (const p of points) {
      if (p.role === 'walker') {
        const idx = (p.meta as { walkerIndex?: number })?.walkerIndex;
        if (idx === 0) {
          ctx.fillText(`X_t = (${Math.floor(p.x)},${Math.floor(p.y)})`, p.x + 8, p.y - 8);
        }
      }
    }
  },
};
