// Entry scene：开场——单点 + 坐标轴
// 数学语义：一切从一个点出发
// anchor 偏右上：让 hero 文字（左对齐）和几何形成左右对话

import type { SceneSpec } from './types';
import { rgba } from './types';

export const entryScene: SceneSpec = {
  id: 'entry',
  anchor: { x: 0.72, y: 0.42 },
  sysInfo: {
    space: 'vector space · R²',
    status: 'status · observing',
    object: 'origin · 0',
  },
  copy: {
    glyph: '·',
    sectionLabel: '',
    italicCopy: '没有结构，\n就没有理解。',
  },

  getScreenAnchor: (sctx) => ({
    x: sctx.width * 0.10,
    y: sctx.height * 0.62,
  }),

  layout: (points, sctx) => {
    const { width, height } = sctx;
    points.forEach((p, i) => {
      p.targetX = p.homeX * width;
      p.targetY = p.homeY * height;
      p.role = i === 0 ? 'focus' : 'background';
      p.meta = {};
    });
    // 焦点放在 anchor 附近
    if (points[0]) {
      points[0].targetX = width * 0.72;
      points[0].targetY = height * 0.42;
    }
  },

  drawLayers: (ctx, points, sctx) => {
    const { width, height, color, ink } = sctx;
    // 坐标轴
    const originX = width * 0.18;
    const originY = height * 0.78;

    ctx.strokeStyle = rgba(ink, 0.16);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    // 轴标签
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = rgba(ink, 0.32);
    ctx.fillText('x', width - 16, originY - 6);
    ctx.fillText('y', originX + 6, 14);

    ctx.fillStyle = rgba(ink, 0.5);
    ctx.beginPath();
    ctx.arc(originX, originY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 焦点指向原点的虚线
    const focus = points[0];
    if (focus) {
      ctx.strokeStyle = rgba(color, 0.18);
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(focus.x, focus.y);
      ctx.lineTo(focus.x, originY);
      ctx.moveTo(focus.x, focus.y);
      ctx.lineTo(originX, focus.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  },

  annotate: (ctx, points, sctx) => {
    const { ink, pointer } = sctx;
    ctx.font = '9px JetBrains Mono, monospace';
    for (const p of points) {
      const md = pointer.active ? Math.hypot(p.x - pointer.x, p.y - pointer.y) : 999;
      const showSampled = p.index % 11 === 0;
      if (md < 160 || showSampled) {
        const fade = md < 160 ? 0.42 : 0.18;
        ctx.fillStyle = rgba(ink, fade);
        ctx.fillText(`(${Math.floor(p.x)},${Math.floor(p.y)})`, p.x + 6, p.y - 5);
      }
    }
  },
};
