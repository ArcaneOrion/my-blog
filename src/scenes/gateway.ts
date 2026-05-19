// Gateway scene：博客入口
// 数学语义：所有结构收束于一个圆环——门
// 点击圆环（半径 1.2x 范围内）触发随机过渡动画

import type { SceneSpec, SceneCtx } from './types';
import { rgba } from './types';
import { pickTransition } from '../transitions';

function anchorCenter(sctx: SceneCtx): { cx: number; cy: number; radius: number } {
  const cx = sctx.width * 0.5;
  const cy = sctx.height * 0.5;
  const radius = Math.min(sctx.width, sctx.height) * 0.18;
  return { cx, cy, radius };
}

function hoverFactor(sctx: SceneCtx): number {
  if (!sctx.pointer.active) return 0;
  const { cx, cy, radius } = anchorCenter(sctx);
  const d = Math.hypot(sctx.pointer.x - cx, sctx.pointer.y - cy);
  return Math.max(0, 1 - d / (radius * 2.5));
}

// 1.2x 半径热区
function isInHitZone(x: number, y: number, sctx: SceneCtx): boolean {
  const { cx, cy, radius } = anchorCenter(sctx);
  const d = Math.hypot(x - cx, y - cy);
  return d <= radius * 1.2;
}

export const gatewayScene: SceneSpec = {
  id: 'gateway',
  anchor: { x: 0.5, y: 0.5 },
  sysInfo: {
    space: 'state · convergent',
    status: 'status · ready',
    object: 'object · gateway',
  },
  copy: {
    glyph: '○',
    sectionLabel: 'iv. enter',
    italicCopy: '其余三个层面，\n在各自的空间里展开。\n\n推门进入。',
    sideNote: 'math · ai · quant',
  },

  cursor: 'pointer',

  getScreenAnchor: (sctx) => ({
    x: sctx.width * 0.5,
    y: sctx.height * 0.22,
  }),

  hitTest: (x, y, sctx) => isInHitZone(x, y, sctx),

  onClick: (sctx) => {
    const { cx, cy, radius } = anchorCenter(sctx);
    const root = (sctx as any).blogRoot ?? '';
    const targetUrl = `${root}/blog`.replace(/\/+/g, '/');
    const transition = pickTransition();
    transition.play({
      center: { x: cx, y: cy },
      radius,
      targetUrl,
    });
  },

  layout: (points, sctx) => {
    const { cx, cy, radius } = anchorCenter(sctx);
    const hover = hoverFactor(sctx);
    const dynRadius = radius * (1 + hover * 0.35);

    const gapAngle = sctx.time * 0.00018;
    const gapWidth = 0.45;

    const sweep = Math.PI * 2 - gapWidth;
    points.forEach((p, i) => {
      const t = i / Math.max(1, points.length - 1);
      const theta = gapAngle + gapWidth / 2 + t * sweep;
      const swirlPull = hover * 0.15;
      const baseX = cx + Math.cos(theta) * dynRadius;
      const baseY = cy + Math.sin(theta) * dynRadius;
      if (hover > 0 && sctx.pointer.active) {
        p.targetX = baseX + (sctx.pointer.x - baseX) * swirlPull;
        p.targetY = baseY + (sctx.pointer.y - baseY) * swirlPull;
      } else {
        p.targetX = baseX;
        p.targetY = baseY;
      }
      p.role = 'ring';
      p.meta = { theta };
    });
  },

  drawLayers: (ctx, points, sctx) => {
    const { color, ink, time } = sctx;
    const { cx, cy, radius } = anchorCenter(sctx);
    const hover = hoverFactor(sctx);
    const dynRadius = radius * (1 + hover * 0.35);

    const gapAngle = time * 0.00018;
    const gapWidth = 0.45;

    // 主圆环
    ctx.strokeStyle = rgba(color, 0.36 + hover * 0.3);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, dynRadius, gapAngle + gapWidth / 2, gapAngle - gapWidth / 2 + Math.PI * 2);
    ctx.stroke();

    if (hover > 0) {
      ctx.strokeStyle = rgba(color, hover * 0.22);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, dynRadius * 1.35, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = rgba(color, hover * 0.14);
      ctx.beginPath();
      ctx.arc(cx, cy, dynRadius * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }

    const markRadius = dynRadius;
    const markA = gapAngle + gapWidth / 2;
    const markB = gapAngle - gapWidth / 2;
    ctx.fillStyle = rgba(color, 0.6);
    for (const a of [markA, markB]) {
      const px = cx + Math.cos(a) * markRadius;
      const py = cy + Math.sin(a) * markRadius;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = rgba(ink, 0.5 + hover * 0.3);
    ctx.beginPath();
    ctx.arc(cx, cy, 2 + hover * 1.5, 0, Math.PI * 2);
    ctx.fill();

    const beam = 0.06 + hover * 0.22;
    ctx.strokeStyle = rgba(color, beam);
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
      const a = (i / 4) * Math.PI * 2 + time * 0.0001;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (dynRadius * 0.4), cy + Math.sin(a) * (dynRadius * 0.4));
      ctx.lineTo(cx + Math.cos(a) * (dynRadius * 0.9), cy + Math.sin(a) * (dynRadius * 0.9));
      ctx.stroke();
    }
  },

  annotate: (ctx, points, sctx) => {
    const { color, ink } = sctx;
    const { cx, cy, radius } = anchorCenter(sctx);
    const hover = hoverFactor(sctx);

    ctx.font = 'italic 12px "Cormorant Garamond", serif';
    ctx.fillStyle = rgba(ink, 0.5 + hover * 0.3);
    ctx.textAlign = 'center';
    ctx.fillText('enter', cx, cy + radius * (1 + hover * 0.35) + 26);
    ctx.textAlign = 'start';

    if (hover > 0.3) {
      ctx.font = '8px JetBrains Mono, monospace';
      ctx.fillStyle = rgba(color, hover * 0.6);
      ctx.textAlign = 'center';
      ctx.fillText('door · open · click', cx, cy + radius * (1 + hover * 0.35) + 42);
      ctx.textAlign = 'start';
    }
  },
};
