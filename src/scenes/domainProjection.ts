import type { SceneSpec, SceneCtx } from './types';
import { rgba } from './types';
import { linearAlgebraScene } from './linearAlgebra';

function center(sctx: SceneCtx) {
  return {
    cx: sctx.width * 0.5,
    cy: sctx.height * 0.48,
    span: Math.min(sctx.width, sctx.height),
  };
}

function drawProjectionPlane(ctx: CanvasRenderingContext2D, sctx: SceneCtx, tilt = 0) {
  const { cx, cy, span } = center(sctx);
  const w = span * 0.76;
  const h = span * 0.46;
  const skew = span * tilt;

  ctx.save();
  ctx.strokeStyle = rgba(sctx.ink, 0.07);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.5 + skew, cy - h * 0.5);
  ctx.lineTo(cx + w * 0.5 + skew, cy - h * 0.5);
  ctx.lineTo(cx + w * 0.5 - skew, cy + h * 0.5);
  ctx.lineTo(cx - w * 0.5 - skew, cy + h * 0.5);
  ctx.closePath();
  ctx.stroke();

  for (let i = 1; i < 7; i += 1) {
    const t = i / 7;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.5 + skew * (1 - t * 2), cy - h * 0.5 + h * t);
    ctx.lineTo(cx + w * 0.5 + skew * (1 - t * 2), cy - h * 0.5 + h * t);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.5 + w * t + skew, cy - h * 0.5);
    ctx.lineTo(cx - w * 0.5 + w * t - skew, cy + h * 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

const aiProjectionScene: SceneSpec = {
  id: 'projection-ai',
  anchor: { x: 0.52, y: 0.46 },
  sysInfo: {
    space: 'projection · latent graph → R²',
  },
  copy: {
    glyph: 'λ',
    sectionLabel: 'projection · ai',
    italicCopy: 'AI 节点展开。',
  },

  getScreenAnchor: (sctx) => ({
    x: sctx.width * 0.22,
    y: sctx.height * 0.58,
  }),

  getStretch: (sctx) => 0.5 + Math.sin(sctx.time * 0.0007) * 0.5,

  layout: (points, sctx) => {
    const { cx, cy, span } = center(sctx);
    const rings = [0, span * 0.13, span * 0.25];
    points.forEach((p, i) => {
      if (i === 0) {
        p.targetX = cx;
        p.targetY = cy;
        p.role = 'ai-core';
        p.meta = {};
        return;
      }

      if (i < 31) {
        const ring = i < 10 ? 1 : 2;
        const count = ring === 1 ? 9 : 21;
        const offset = ring === 1 ? 1 : 10;
        const local = i - offset;
        const phase = sctx.time * 0.00018 * (ring === 1 ? 1 : -1);
        const angle = (local / count) * Math.PI * 2 + phase + ring * 0.28;
        const wobble = 1 + Math.sin(sctx.time * 0.001 + i * 0.8) * 0.045;
        p.targetX = cx + Math.cos(angle) * rings[ring] * wobble;
        p.targetY = cy + Math.sin(angle) * rings[ring] * 0.62 * wobble;
        p.role = ring === 1 ? 'ai-context' : 'ai-memory';
        p.meta = { ring, local };
      } else {
        p.targetX = p.homeX * sctx.width;
        p.targetY = p.homeY * sctx.height;
        p.role = 'background';
        p.meta = {};
      }
    });
  },

  drawLayers: (ctx, points, sctx) => {
    const { cx, cy, span } = center(sctx);
    drawProjectionPlane(ctx, sctx, 0.09);

    const core = points.find((p) => p.role === 'ai-core');
    const context = points.filter((p) => p.role === 'ai-context');
    const memory = points.filter((p) => p.role === 'ai-memory');
    if (!core) return;

    ctx.strokeStyle = rgba(sctx.color, 0.24);
    ctx.lineWidth = 1.1;
    context.forEach((p, i) => {
      ctx.beginPath();
      ctx.moveTo(core.x, core.y);
      const mx = (core.x + p.x) * 0.5 + Math.sin(sctx.time * 0.001 + i) * 18;
      const my = (core.y + p.y) * 0.5 - Math.cos(sctx.time * 0.001 + i) * 10;
      ctx.quadraticCurveTo(mx, my, p.x, p.y);
      ctx.stroke();
    });

    ctx.strokeStyle = rgba(sctx.color, 0.14);
    memory.forEach((p, i) => {
      const target = context[i % context.length];
      if (!target) return;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    });

    ctx.strokeStyle = rgba(sctx.color, 0.28);
    ctx.setLineDash([3, 7]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, span * 0.27, span * 0.17, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, span * 0.14, span * 0.09, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },

  annotate: (ctx, points, sctx) => {
    const { cx, cy } = center(sctx);
    ctx.font = 'italic 12px "Cormorant Garamond", serif';
    ctx.fillStyle = rgba(sctx.color, 0.68);
    ctx.fillText('λ(context)', cx + 12, cy - 12);
  },
};

const quantProjectionScene: SceneSpec = {
  id: 'projection-quant',
  anchor: { x: 0.48, y: 0.52 },
  sysInfo: {
    space: 'projection · phase space → R²',
  },
  copy: {
    glyph: 'σ',
    sectionLabel: 'projection · quant',
    italicCopy: 'Quant 节点展开。',
  },

  getScreenAnchor: (sctx) => ({
    x: sctx.width * 0.76,
    y: sctx.height * 0.50,
  }),

  getStretch: (sctx) => 0.5 + Math.sin(sctx.time * 0.00045) * 0.5,

  layout: (points, sctx) => {
    const { cx, cy, span } = center(sctx);
    points.forEach((p, i) => {
      if (i < 36) {
        const t = i / 35;
        const angle = t * Math.PI * 2.35 + sctx.time * 0.00016;
        const radius = span * (0.08 + t * 0.25);
        p.targetX = cx + Math.cos(angle) * radius;
        p.targetY = cy + Math.sin(angle * 1.22) * radius * 0.42 + (t - 0.5) * span * 0.2;
        p.role = 'quant-trajectory';
        p.meta = { t };
      } else {
        p.targetX = p.homeX * sctx.width;
        p.targetY = p.homeY * sctx.height;
        p.role = 'background';
        p.meta = {};
      }
    });
  },

  drawLayers: (ctx, points, sctx) => {
    const { cx, cy, span } = center(sctx);
    drawProjectionPlane(ctx, sctx, -0.08);

    const trajectory = points.filter((p) => p.role === 'quant-trajectory');
    ctx.strokeStyle = rgba(sctx.color, 0.56);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    trajectory.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    ctx.strokeStyle = rgba(sctx.ink, 0.12);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - span * 0.36, cy + span * 0.22);
    ctx.lineTo(cx + span * 0.36, cy + span * 0.22);
    ctx.moveTo(cx - span * 0.28, cy + span * 0.3);
    ctx.lineTo(cx - span * 0.28, cy - span * 0.25);
    ctx.stroke();

    ctx.strokeStyle = rgba(sctx.color, 0.22);
    ctx.setLineDash([4, 7]);
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.ellipse(cx, cy + span * 0.04, span * (0.12 + i * 0.07), span * (0.045 + i * 0.025), -0.18, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  },

  annotate: (ctx, points, sctx) => {
    const { cx, cy, span } = center(sctx);
    ctx.font = 'italic 12px "Cormorant Garamond", serif';
    ctx.fillStyle = rgba(sctx.color, 0.66);
    ctx.fillText('dS / S = μdt + σdW', cx + span * 0.06, cy - span * 0.17);
  },
};

export const projectionScenesByMode: Record<string, SceneSpec> = {
  math: linearAlgebraScene,
  ai: aiProjectionScene,
  quant: quantProjectionScene,
};
