// portal 穿越式 transition
// 几何：透视收敛 + 圆环穿过 + 持久文字
//
// 节奏（总长 ~2400ms）：
//   [0    -  320ms]  吸气：page-shell 元素 blur + 淡出，sys-info 退场
//   [320  - 1500ms]  收敛：全屏 perspective 网格线向圆心收缩；圆环开始变亮
//                    第一行 mono 文字浮现
//   [1500 - 2100ms]  加速：圆环 r → 8r ease-in-cubic，背景被吞入圆心
//                    第二行 mono 文字浮现
//   [2100 - 2400ms]  闪白：高亮白闪 → fade 到目标页背景色
//
// 实现：SVG 容器 + 独立 fade overlay
// 不冻结主 canvas（freezeCanvas: false）：让 canvas 自己淡出

import type { TransitionSpec } from './types';
import { createOverlay } from './types';

const GRID_LINES = 16; // 收敛网格线条数（从屏幕边缘 → 圆心）
const PORTAL_SCALE = 8;

export const portalTransition: TransitionSpec = {
  id: 'portal',
  durationMs: 2400,
  freezeCanvas: false,

  play: async ({ center, radius, targetUrl }) => {
    const overlay = createOverlay('transition-portal');

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'position:absolute;inset:0;';
    overlay.appendChild(svg);

    const W = window.innerWidth;
    const H = window.innerHeight;
    const diag = Math.hypot(W, H);

    // ============ 阶段 1: 主页元素淡退 ============
    // 让 page-fade-in 容器（包含主要 HTML 内容）的内容轻微 blur + 透明
    const pageRoot = document.querySelector<HTMLElement>('.page-fade-in');
    const narrativeLayer = document.querySelector<HTMLElement>('.narrative-layer');
    const sysInfo = document.querySelector<HTMLElement>('.sys-info');
    const structureField = document.querySelector<HTMLElement>('[data-structure-field]');

    [pageRoot, narrativeLayer, sysInfo].forEach((el) => {
      if (!el) return;
      el.style.transition = 'opacity 600ms ease, filter 800ms ease';
      el.style.opacity = '1';
      el.style.filter = 'blur(0px)';
    });

    // canvas 单独缓慢淡出（保留几何感）
    if (structureField) {
      structureField.style.transition = 'opacity 1200ms ease, filter 1400ms ease';
    }

    // ============ 阶段 2: 透视收敛网格 ============
    // GRID_LINES 条从屏幕外围向圆心的细线
    const gridLines: SVGLineElement[] = [];
    for (let i = 0; i < GRID_LINES; i += 1) {
      const angle = (i / GRID_LINES) * Math.PI * 2;
      const startX = center.x + Math.cos(angle) * diag;
      const startY = center.y + Math.sin(angle) * diag;
      const endX = center.x + Math.cos(angle) * (radius * 1.05);
      const endY = center.y + Math.sin(angle) * (radius * 1.05);

      const line = document.createElementNS(svgNS, 'line');
      // 初始：与"中点 → 中心"的方向反向延伸到屏幕外（隐藏在视野外）
      // 让动画把它们从屏幕外"拉进来"
      line.setAttribute('x1', `${startX}`);
      line.setAttribute('y1', `${startY}`);
      line.setAttribute('x2', `${startX}`); // 末端初始也在外
      line.setAttribute('y2', `${startY}`);
      line.setAttribute('stroke', 'rgba(29, 78, 216, 0.0)');
      line.setAttribute('stroke-width', '0.6');
      line.style.transition = `all 1200ms cubic-bezier(0.5, 0, 0.5, 1) ${100 + i * 18}ms`;
      svg.appendChild(line);

      (line as any).__endX = endX;
      (line as any).__endY = endY;
      gridLines.push(line);
    }

    // ============ 阶段 2-3: 中心圆环 ============
    const ringCircle = document.createElementNS(svgNS, 'circle');
    ringCircle.setAttribute('cx', `${center.x}`);
    ringCircle.setAttribute('cy', `${center.y}`);
    ringCircle.setAttribute('r', `${radius}`);
    ringCircle.setAttribute('fill', 'none');
    ringCircle.setAttribute('stroke', 'rgba(29, 78, 216, 0.4)');
    ringCircle.setAttribute('stroke-width', '1.4');
    ringCircle.style.transition = 'r 700ms cubic-bezier(0.55, 0, 0.85, 0), stroke 700ms ease, stroke-width 700ms ease, opacity 300ms ease 600ms';
    svg.appendChild(ringCircle);

    // 中心光点
    const centerDot = document.createElementNS(svgNS, 'circle');
    centerDot.setAttribute('cx', `${center.x}`);
    centerDot.setAttribute('cy', `${center.y}`);
    centerDot.setAttribute('r', '0');
    centerDot.setAttribute('fill', 'rgba(29, 78, 216, 0.7)');
    centerDot.style.transition = 'r 800ms cubic-bezier(0.4, 0, 0.6, 1), opacity 400ms ease';
    svg.appendChild(centerDot);

    // ============ 阶段 2-3: 持久文字（两行 mono） ============
    const makeLabel = (text: string, delay: number) => {
      const el = document.createElement('div');
      Object.assign(el.style, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        fontFamily: 'JetBrains Mono, IBM Plex Mono, monospace',
        fontSize: '0.62rem',
        letterSpacing: '0.42em',
        textTransform: 'uppercase',
        color: 'rgba(29, 78, 216, 0.78)',
        opacity: '0',
        whiteSpace: 'nowrap',
        transition: `opacity 500ms ease ${delay}ms, transform 700ms ease ${delay}ms`,
        pointerEvents: 'none',
      });
      el.textContent = text;
      overlay.appendChild(el);
      return el;
    };

    const labelA = makeLabel('entering · R² → ?', 800);
    labelA.style.transform = 'translate(-50%, calc(-50% - 60px))';
    const labelB = makeLabel('displacement · field', 1500);
    labelB.style.transform = 'translate(-50%, calc(-50% + 60px))';

    // ============ 闪白 overlay ============
    const fade = document.createElement('div');
    Object.assign(fade.style, {
      position: 'absolute',
      inset: '0',
      background: 'rgba(251, 250, 247, 0)',
      transition: 'background 700ms cubic-bezier(0.7, 0, 0.84, 0)',
    });
    overlay.appendChild(fade);

    // ============ 启动动画 ============
    await new Promise(requestAnimationFrame);

    // T+0：page 元素开始淡退
    if (pageRoot) {
      pageRoot.style.opacity = '0.15';
      pageRoot.style.filter = 'blur(3px)';
    }
    if (narrativeLayer) {
      narrativeLayer.style.opacity = '0';
      narrativeLayer.style.filter = 'blur(6px)';
    }
    if (sysInfo) sysInfo.style.opacity = '0';

    // T+100ms：网格线从外向圆心收敛
    setTimeout(() => {
      gridLines.forEach((line) => {
        line.setAttribute('x2', `${(line as any).__endX}`);
        line.setAttribute('y2', `${(line as any).__endY}`);
        line.setAttribute('stroke', 'rgba(29, 78, 216, 0.38)');
      });
      // 中心光点出现
      centerDot.setAttribute('r', '2.5');
    }, 100);

    // T+700ms：文字浮现到位
    setTimeout(() => {
      labelA.style.opacity = '0.85';
      labelA.style.transform = 'translate(-50%, calc(-50% - 78px))';
    }, 700);

    // T+1400ms：圆环加速放大（穿过的瞬间）
    setTimeout(() => {
      ringCircle.setAttribute('r', `${radius * PORTAL_SCALE}`);
      ringCircle.setAttribute('stroke', 'rgba(29, 78, 216, 0.05)');
      ringCircle.setAttribute('stroke-width', '0.4');
      // canvas 也开始淡出
      if (structureField) {
        structureField.style.opacity = '0.0';
        structureField.style.filter = 'blur(8px)';
      }
      // 第二行文字
      labelB.style.opacity = '0.7';
      labelB.style.transform = 'translate(-50%, calc(-50% + 78px))';
    }, 1400);

    // T+1900ms：开始闪白
    setTimeout(() => {
      fade.style.background = 'rgba(251, 250, 247, 0.92)';
      // 文字也开始淡出
      labelA.style.opacity = '0';
      labelB.style.opacity = '0';
    }, 1900);

    // T+2200ms：最后一闪到全白
    await new Promise((resolve) => setTimeout(resolve, 2200));
    fade.style.transition = 'background 180ms linear';
    fade.style.background = 'rgba(251, 250, 247, 1)';

    await new Promise((resolve) => setTimeout(resolve, 200));

    window.location.href = targetUrl;
  },
};
