// Linear Algebra scene：基向量 + 网格变换
// 数学语义：矩阵把网格扭曲成新的形状，平行线仍然平行
// anchor 偏右下，文字在左、网格在右

import type { SceneSpec, PointState, SceneCtx } from './types';
import { rgba } from './types';

// 慢变化的 2x2 变换矩阵
function transformMatrix(t: number): [number, number, number, number] {
  const s = t * 0.0003;
  return [
    1 + Math.sin(s) * 0.32,
    Math.cos(s * 1.3) * 0.42,
    Math.sin(s * 0.7) * 0.22,
    1 + Math.cos(s * 1.1) * 0.32,
  ];
}

function applyMatrix(m: [number, number, number, number], x: number, y: number): [number, number] {
  return [m[0] * x + m[1] * y, m[2] * x + m[3] * y];
}

// 网格几何中心（anchor 位置的像素坐标）
function anchorCenter(sctx: SceneCtx): { cx: number; cy: number; unit: number } {
  const cx = sctx.width * 0.65;
  const cy = sctx.height * 0.58;
  const unit = Math.min(sctx.width, sctx.height) * 0.08;
  return { cx, cy, unit };
}

export const linearAlgebraScene: SceneSpec = {
  id: 'linear-algebra',
  anchor: { x: 0.65, y: 0.58 },
  sysInfo: {
    space: 'space · R² → R²',
    status: 'status · transforming',
    object: 'object · matrix M',
  },
  copy: {
    glyph: '⊞',
    sectionLabel: 'i. linear algebra',
    italicCopy: '给我两个方向，\n我给你一整个空间。\n矩阵把网格掰弯——\n平行线仍然平行。',
    sideNote: 'M ∈ R²ˣ²\ne₁ · e₂',
  },

  getScreenAnchor: (sctx) => ({
    x: sctx.width * 0.18,
    y: sctx.height * 0.50,
  }),

  getStretch: (sctx) => {
    const m = transformMatrix(sctx.time);
    const delta = Math.hypot(m[0] - 1, m[1], m[2], m[3] - 1);
    return Math.min(1, delta / 0.7);
  },

  layout: (points, sctx) => {
    const { cx, cy, unit } = anchorCenter(sctx);
    const m = transformMatrix(sctx.time);

    // 5×5 网格交点（25 个点）映射到点云前 25 个
    const gridSize = 5;
    const offset = (gridSize - 1) / 2;
    let gridIndex = 0;
    points.forEach((p, i) => {
      if (gridIndex < gridSize * gridSize) {
        const gx = (gridIndex % gridSize) - offset;
        const gy = Math.floor(gridIndex / gridSize) - offset;
        const [tx, ty] = applyMatrix(m, gx, gy);
        p.targetX = cx + tx * unit;
        p.targetY = cy + ty * unit;
        p.role = 'grid-node';
        p.meta = { gx, gy };
        gridIndex += 1;
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
    const { cx, cy, unit } = anchorCenter(sctx);
    const m = transformMatrix(time);

    // 1. 原始网格（淡灰，未变换）
    ctx.strokeStyle = rgba(ink, 0.08);
    ctx.lineWidth = 1;
    const span = 3;
    for (let i = -span; i <= span; i += 1) {
      ctx.beginPath();
      ctx.moveTo(cx + i * unit, cy - span * unit);
      ctx.lineTo(cx + i * unit, cy + span * unit);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - span * unit, cy + i * unit);
      ctx.lineTo(cx + span * unit, cy + i * unit);
      ctx.stroke();
    }

    // 2. 变换后的网格（数学色，主体）
    ctx.strokeStyle = rgba(color, 0.32);
    ctx.lineWidth = 1.2;
    // 横线（沿 y 方向移动）
    for (let i = -span; i <= span; i += 1) {
      ctx.beginPath();
      for (let j = -span; j <= span; j += 0.5) {
        const [tx, ty] = applyMatrix(m, j, i);
        const px = cx + tx * unit;
        const py = cy + ty * unit;
        if (j === -span) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    // 竖线
    for (let j = -span; j <= span; j += 1) {
      ctx.beginPath();
      for (let i = -span; i <= span; i += 0.5) {
        const [tx, ty] = applyMatrix(m, j, i);
        const px = cx + tx * unit;
        const py = cy + ty * unit;
        if (i === -span) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // 3. 原点
    ctx.fillStyle = rgba(ink, 0.7);
    ctx.beginPath();
    ctx.arc(cx, cy, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // 4. 两个基向量 e₁ e₂（变换后）
    const [e1x, e1y] = applyMatrix(m, 1, 0);
    const [e2x, e2y] = applyMatrix(m, 0, 1);
    const drawArrow = (toX: number, toY: number, accent: number) => {
      ctx.strokeStyle = rgba(color, accent);
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + toX * unit, cy + toY * unit);
      ctx.stroke();
      // 箭头小三角
      const angle = Math.atan2(toY, toX);
      const ex = cx + toX * unit;
      const ey = cy + toY * unit;
      const ah = 8;
      ctx.fillStyle = rgba(color, accent);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - ah * Math.cos(angle - 0.4), ey - ah * Math.sin(angle - 0.4));
      ctx.lineTo(ex - ah * Math.cos(angle + 0.4), ey - ah * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();
    };
    drawArrow(e1x, e1y, 0.78);
    drawArrow(e2x, e2y, 0.78);
  },

  annotate: (ctx, points, sctx) => {
    const { color, ink, time, pointer } = sctx;
    const { cx, cy, unit } = anchorCenter(sctx);
    const m = transformMatrix(time);

    // 基向量标签
    const [e1x, e1y] = applyMatrix(m, 1, 0);
    const [e2x, e2y] = applyMatrix(m, 0, 1);
    ctx.font = 'italic 13px "Cormorant Garamond", serif';
    ctx.fillStyle = rgba(color, 0.78);
    ctx.fillText('e₁', cx + e1x * unit + 8, cy + e1y * unit + 4);
    ctx.fillText('e₂', cx + e2x * unit + 8, cy + e2y * unit + 4);

    // 网格节点鼠标附近显示变换前后的坐标
    ctx.font = '9px JetBrains Mono, monospace';
    for (const p of points) {
      if (p.role === 'grid-node' && p.meta && pointer.active) {
        const md = Math.hypot(p.x - pointer.x, p.y - pointer.y);
        if (md < 80) {
          const gx = (p.meta as { gx: number }).gx;
          const gy = (p.meta as { gy: number }).gy;
          ctx.fillStyle = rgba(ink, 0.5);
          ctx.fillText(`(${gx},${gy})→`, p.x + 6, p.y - 5);
        }
      }
    }

    // 矩阵 M 标注（左下角）
    const matrixX = cx - unit * 3.5;
    const matrixY = cy + unit * 3.2;
    ctx.font = 'italic 11px "Cormorant Garamond", serif';
    ctx.fillStyle = rgba(ink, 0.45);
    ctx.fillText('M =', matrixX - 30, matrixY + 4);
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = rgba(ink, 0.4);
    ctx.fillText(`${m[0].toFixed(2)}  ${m[1].toFixed(2)}`, matrixX, matrixY - 5);
    ctx.fillText(`${m[2].toFixed(2)}  ${m[3].toFixed(2)}`, matrixX, matrixY + 7);
  },
};
