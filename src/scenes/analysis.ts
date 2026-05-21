// Analysis scene：猎户座 + 椭圆轨迹
// 数学语义：S² 到 R² 的投影 + 开普勒轨道（微分方程的解）
// anchor 居中偏上——星空作为画面高点

import type { SceneSpec, SceneCtx } from './types';
import { rgba } from './types';

// 猎户座 8 颗主星（相对坐标 0-1，按屏幕方向归一化）
const orionStars = [
  { name: 'Betelgeuse', greek: 'α', mag: 0.5, x: 0.62, y: 0.30 },
  { name: 'Bellatrix',  greek: 'γ', mag: 1.6, x: 0.38, y: 0.33 },
  { name: 'Mintaka',    greek: 'δ', mag: 2.2, x: 0.55, y: 0.55 },
  { name: 'Alnilam',    greek: 'ε', mag: 1.7, x: 0.50, y: 0.57 },
  { name: 'Alnitak',    greek: 'ζ', mag: 2.0, x: 0.45, y: 0.59 },
  { name: 'Saiph',      greek: 'κ', mag: 2.1, x: 0.40, y: 0.78 },
  { name: 'Rigel',      greek: 'β', mag: 0.1, x: 0.62, y: 0.80 },
  { name: 'Meissa',     greek: 'λ', mag: 3.4, x: 0.51, y: 0.13 },
];

const orionLines: Array<[number, number]> = [
  [0, 1], [0, 4], [1, 2], [2, 3], [3, 4],
  [4, 5], [2, 6], [5, 6], [0, 7], [1, 7],
];

// 哪些主星周围画椭圆轨迹（不全画，避免视觉过载）
const orbitStarIndices = [0, 3, 6]; // Betelgeuse, Alnilam, Rigel

function anchorCenter(sctx: SceneCtx): { cx: number; cy: number; span: number } {
  const cx = sctx.width * 0.48;
  const cy = sctx.height * 0.42;
  const span = Math.min(sctx.width, sctx.height) * 0.6;
  return { cx, cy, span };
}

export const analysisScene: SceneSpec = {
  id: 'analysis',
  anchor: { x: 0.48, y: 0.42 },
  sysInfo: {
    space: 'projection · S² → R²',
  },
  copy: {
    glyph: '∮',
    sectionLabel: 'ii. analysis',
    italicCopy: '球面上的猎户，\n投影到平面仍是猎户。',
    sideNote: 'α · β · γ · δ\nε · ζ · κ · λ',
  },

  getScreenAnchor: (sctx) => ({
    x: sctx.width * 0.80,
    y: sctx.height * 0.66,
  }),

  layout: (points, sctx) => {
    const { cx, cy, span } = anchorCenter(sctx);

    points.forEach((p, i) => {
      if (i < orionStars.length) {
        p.targetX = cx + (orionStars[i].x - 0.5) * span;
        p.targetY = cy + (orionStars[i].y - 0.5) * span;
        p.role = 'orion';
        p.meta = { orionIndex: i };
      } else {
        p.targetX = p.homeX * sctx.width;
        p.targetY = p.homeY * sctx.height;
        p.role = 'background';
        p.meta = {};
      }
    });
  },

  drawLayers: (ctx, points, sctx) => {
    const { color, ink, time } = sctx;
    const { cx, cy, span } = anchorCenter(sctx);

    // 球面 hint - 外圆
    ctx.strokeStyle = rgba(ink, 0.07);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, span * 0.55, span * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 经纬线
    ctx.strokeStyle = rgba(ink, 0.05);
    for (let i = 1; i <= 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, span * 0.55 * (i / 4), span * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, span * 0.55, span * 0.55 * (i / 4), 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 找到对应的 orion points
    const orionPoints: Array<{ x: number; y: number } | undefined> = [];
    for (const p of points) {
      const idx = (p.meta as { orionIndex?: number })?.orionIndex;
      if (idx !== undefined && p.role === 'orion') {
        orionPoints[idx] = p;
      }
    }

    // 慢速交替：星座线 ↔ r-邻近图
    const cycle = (Math.sin(time * 0.0004) + 1) / 2;
    const constellationAlpha = 0.5 * cycle + 0.2;

    // 标准星座连线
    ctx.strokeStyle = rgba(color, constellationAlpha);
    ctx.lineWidth = 1.3;
    for (const [i, j] of orionLines) {
      if (orionPoints[i] && orionPoints[j]) {
        ctx.beginPath();
        ctx.moveTo(orionPoints[i]!.x, orionPoints[i]!.y);
        ctx.lineTo(orionPoints[j]!.x, orionPoints[j]!.y);
        ctx.stroke();
      }
    }

    // 椭圆轨迹（每颗 orbit 星周围 2 圈）
    const baseR = span * 0.06;
    for (const starIdx of orbitStarIndices) {
      const star = orionPoints[starIdx];
      if (!star) continue;
      const seed = starIdx * 0.7;

      for (let ring = 0; ring < 2; ring += 1) {
        const a = baseR * (1 + ring * 0.55);
        const b = a * (0.5 + ring * 0.08);
        const rotation = seed + ring * 0.4 + time * 0.00008;

        ctx.strokeStyle = rgba(color, 0.18 - ring * 0.04);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(star.x, star.y, a, b, rotation, 0, Math.PI * 2);
        ctx.stroke();

        // "行星" 沿轨迹运动
        const phi = time * (0.0007 - ring * 0.0002) + seed + ring * 1.7;
        const lx = a * Math.cos(phi);
        const ly = b * Math.sin(phi);
        const px = star.x + lx * Math.cos(rotation) - ly * Math.sin(rotation);
        const py = star.y + lx * Math.sin(rotation) + ly * Math.cos(rotation);

        const grad = ctx.createRadialGradient(px, py, 0, px, py, 6);
        grad.addColorStop(0, rgba(color, 0.55));
        grad.addColorStop(1, rgba(color, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rgba(ink, 0.78);
        ctx.beginPath();
        ctx.arc(px, py, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 投影虚线：腰带中星 Alnilam 向底部基线投影
    const alnilam = orionPoints[3];
    if (alnilam) {
      const baseY = cy + span * 0.58;
      ctx.strokeStyle = rgba(color, 0.18);
      ctx.setLineDash([2, 5]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(alnilam.x, alnilam.y);
      ctx.lineTo(alnilam.x, baseY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - span * 0.55, baseY);
      ctx.lineTo(cx + span * 0.55, baseY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = rgba(color, 0.6);
      ctx.beginPath();
      ctx.arc(alnilam.x, baseY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  annotate: (ctx, points, sctx) => {
    const { ink } = sctx;
    ctx.font = 'italic 11px "Cormorant Garamond", serif';
    ctx.fillStyle = rgba(ink, 0.45);
    for (const p of points) {
      const idx = (p.meta as { orionIndex?: number })?.orionIndex;
      if (idx !== undefined && p.role === 'orion') {
        const star = orionStars[idx];
        ctx.fillText(star.greek, p.x + 9, p.y - 7);
      }
    }
  },
};
