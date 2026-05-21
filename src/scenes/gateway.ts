// Gateway scene：博客入口 — 滚动终点站
// 数学语义：所有结构收束于一个圆环 — 门;
//          周围 5 个对应结构域的小节点(暗示门后是五个投影场);
//          外层一圈淡矩形门框,强化"入口"感
// 点击圆环（半径 1.2x 范围内）触发随机过渡动画

import type { SceneSpec, SceneCtx } from './types';
import { rgba } from './types';

// 五个结构域的颜色,用于外圈节点
const DOMAIN_COLORS: Array<[number, number, number]> = [
  [29, 78, 216],   // math
  [190, 24, 93],   // ai
  [15, 118, 110],  // quant
  [124, 58, 237],  // self
  [176, 137, 64],  // journal
];

function anchorCenter(sctx: SceneCtx): { cx: number; cy: number; radius: number } {
  const cx = sctx.width * 0.5;
  const cy = sctx.height * 0.5;
  // 升级:半径从 0.18 → 0.24,大幅提升视觉重量
  const radius = Math.min(sctx.width, sctx.height) * 0.24;
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
    space: '',
  },
  copy: {
    glyph: '○',
    sectionLabel: '',
    italicCopy: '推门进入。',
    sideNote: 'ai · math · quant\nself · journal',
  },

  cursor: 'pointer',

  getScreenAnchor: (sctx) => ({
    x: sctx.width * 0.5,
    y: sctx.height * 0.18,
  }),

  hitTest: (x, y, sctx) => isInHitZone(x, y, sctx),

  onClick: async (sctx) => {
    const { cx, cy, radius } = anchorCenter(sctx);
    const root = (sctx as any).blogRoot ?? '';
    const targetUrl = `${root}/observatory`.replace(/\/+/g, '/');
    const { pickTransition } = await import('../transitions');
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

    // === 1. 门框:外层一个虚线矩形,暗示"门" ===
    const frameSize = dynRadius * 2.4;
    const frameAlpha = 0.18 + hover * 0.18;
    ctx.strokeStyle = rgba(ink, frameAlpha);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 8]);
    ctx.strokeRect(cx - frameSize / 2, cy - frameSize / 2, frameSize, frameSize);
    ctx.setLineDash([]);

    // 门框四角小标记(强化"门"几何)
    const cornerSize = 10;
    ctx.strokeStyle = rgba(color, 0.45 + hover * 0.3);
    ctx.lineWidth = 1.2;
    const corners: Array<[number, number, number, number]> = [
      [-frameSize / 2, -frameSize / 2, 1, 1],
      [frameSize / 2, -frameSize / 2, -1, 1],
      [-frameSize / 2, frameSize / 2, 1, -1],
      [frameSize / 2, frameSize / 2, -1, -1],
    ];
    for (const [ox, oy, dx, dy] of corners) {
      const px = cx + ox;
      const py = cy + oy;
      ctx.beginPath();
      ctx.moveTo(px, py + dy * cornerSize);
      ctx.lineTo(px, py);
      ctx.lineTo(px + dx * cornerSize, py);
      ctx.stroke();
    }

    // === 2. 五个结构域节点:围绕主圆环缓慢漂移 ===
    const satRadius = dynRadius * 1.55;
    const orbitSpeed = 0.00008;
    for (let i = 0; i < 5; i += 1) {
      const baseAngle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const angle = baseAngle + time * orbitSpeed;
      const sx = cx + Math.cos(angle) * satRadius;
      const sy = cy + Math.sin(angle) * satRadius;

      const sc = DOMAIN_COLORS[i];
      // 光晕
      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 12);
      grad.addColorStop(0, rgba(sc, 0.45 + hover * 0.25));
      grad.addColorStop(1, rgba(sc, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fill();

      // 外圈节点本体
      ctx.fillStyle = rgba(sc, 0.78);
      ctx.beginPath();
      ctx.arc(sx, sy, 2.6, 0, Math.PI * 2);
      ctx.fill();

      // 从外圈节点向圆环画一根细线(只在 hover 时显示)
      if (hover > 0.15) {
        const innerX = cx + Math.cos(angle) * dynRadius;
        const innerY = cy + Math.sin(angle) * dynRadius;
        ctx.strokeStyle = rgba(sc, hover * 0.35);
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(innerX, innerY);
        ctx.stroke();
      }
    }

    // === 3. 主圆环 ===
    ctx.strokeStyle = rgba(color, 0.42 + hover * 0.36);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cx, cy, dynRadius, gapAngle + gapWidth / 2, gapAngle - gapWidth / 2 + Math.PI * 2);
    ctx.stroke();

    // hover 时圆环外多一圈光环
    if (hover > 0) {
      ctx.strokeStyle = rgba(color, hover * 0.28);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, dynRadius * 1.18, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = rgba(color, hover * 0.16);
      ctx.beginPath();
      ctx.arc(cx, cy, dynRadius * 0.78, 0, Math.PI * 2);
      ctx.stroke();
    }

    // === 4. 圆环缺口两端的标记点 ===
    const markRadius = dynRadius;
    const markA = gapAngle + gapWidth / 2;
    const markB = gapAngle - gapWidth / 2;
    ctx.fillStyle = rgba(color, 0.72);
    for (const a of [markA, markB]) {
      const px = cx + Math.cos(a) * markRadius;
      const py = cy + Math.sin(a) * markRadius;
      ctx.beginPath();
      ctx.arc(px, py, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // === 5. 中心点 ===
    ctx.fillStyle = rgba(ink, 0.55 + hover * 0.3);
    ctx.beginPath();
    ctx.arc(cx, cy, 2.2 + hover * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // === 6. 中心放射线(hover 增强) ===
    const beam = 0.08 + hover * 0.26;
    ctx.strokeStyle = rgba(color, beam);
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
      const a = (i / 4) * Math.PI * 2 + time * 0.0001;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (dynRadius * 0.45), cy + Math.sin(a) * (dynRadius * 0.45));
      ctx.lineTo(cx + Math.cos(a) * (dynRadius * 0.85), cy + Math.sin(a) * (dynRadius * 0.85));
      ctx.stroke();
    }
  },

  annotate: (ctx, points, sctx) => {
    // 装饰文字已移除
  },
};
