// wormhole 虫洞穿越式 transition
// 视觉:同心圆从中心向外膨胀,同时整体作 rotateZ 旋转;
//      多层环以不同速度膨胀,产生"沿 z 轴推进"的错觉;
//      色板深紫深蓝。
// 总时长约 2800ms。

import type { TransitionSpec } from './types';
import { createOverlay } from './types';

const RINGS = 14;
const COLORS = [
  'rgba(46, 27, 107, 0.55)',  // deep violet
  'rgba(58, 28, 92, 0.45)',
  'rgba(29, 78, 216, 0.5)',   // math blue
  'rgba(40, 14, 80, 0.35)',
];

export const wormholeTransition: TransitionSpec = {
  id: 'wormhole',
  durationMs: 2800,
  freezeCanvas: false,

  play: async ({ center, radius, targetUrl }) => {
    const overlay = createOverlay('transition-wormhole');

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'position:absolute;inset:0;';
    overlay.appendChild(svg);

    // 旋转容器(整体绕中心旋转)
    const g = document.createElementNS(svgNS, 'g');
    g.style.transformOrigin = `${center.x}px ${center.y}px`;
    g.style.transition = 'transform 2400ms cubic-bezier(0.5, 0, 0.5, 1)';
    g.style.transform = 'rotate(0deg)';
    svg.appendChild(g);

    const W = window.innerWidth;
    const H = window.innerHeight;
    const diag = Math.hypot(W, H);

    // 主页元素退场
    const pageRoot = document.querySelector<HTMLElement>('.page-fade-in');
    const narrativeLayer = document.querySelector<HTMLElement>('.narrative-layer');
    const sysInfo = document.querySelector<HTMLElement>('.sys-info');
    const structureField = document.querySelector<HTMLElement>('[data-structure-field]');

    [pageRoot, narrativeLayer, sysInfo, structureField].forEach((el) => {
      if (el) el.style.transition = 'opacity 700ms ease, filter 900ms ease';
    });

    // RINGS 个同心圆,从圆心半径 0 向外膨胀,呈 z 轴前进感
    const rings: SVGCircleElement[] = [];
    for (let i = 0; i < RINGS; i += 1) {
      const c = document.createElementNS(svgNS, 'circle');
      c.setAttribute('cx', `${center.x}`);
      c.setAttribute('cy', `${center.y}`);
      c.setAttribute('r', `${radius * (0.2 + i * 0.05)}`);
      c.setAttribute('fill', 'none');
      c.setAttribute('stroke', COLORS[i % COLORS.length]);
      c.setAttribute('stroke-width', `${1.0 + (i % 3) * 0.4}`);
      c.style.opacity = '0';
      // 每个环延迟启动,模拟连续推进
      const delay = i * 80;
      const dur = 2000 + i * 30;
      c.style.transition = `r ${dur}ms cubic-bezier(0.55, 0, 0.85, 0) ${delay}ms, stroke ${dur}ms ease ${delay}ms, opacity 300ms ease ${delay}ms, stroke-width ${dur}ms ease ${delay}ms`;
      g.appendChild(c);
      rings.push(c);
    }

    // 中心黑洞奇点(初始隐藏,膨胀阶段慢慢凸显)
    const singularity = document.createElementNS(svgNS, 'circle');
    singularity.setAttribute('cx', `${center.x}`);
    singularity.setAttribute('cy', `${center.y}`);
    singularity.setAttribute('r', '0');
    singularity.setAttribute('fill', 'rgba(15, 8, 40, 0.85)');
    singularity.style.transition = 'r 1200ms cubic-bezier(0.55, 0, 0.85, 0) 600ms, opacity 400ms ease 2100ms';
    svg.appendChild(singularity);

    // 持久文字
    const makeLabel = (text: string, delay: number, yOffset: number, alpha = 0.7) => {
      const el = document.createElement('div');
      Object.assign(el.style, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, calc(-50% + ${yOffset}px))`,
        fontFamily: 'Cormorant Garamond, EB Garamond, serif',
        fontStyle: 'italic',
        fontSize: '1.05rem',
        letterSpacing: '0.04em',
        color: `rgba(58, 28, 130, ${alpha})`,
        opacity: '0',
        whiteSpace: 'nowrap',
        transition: `opacity 700ms ease ${delay}ms, transform 900ms ease ${delay}ms`,
        pointerEvents: 'none',
      });
      el.textContent = text;
      overlay.appendChild(el);
      return el;
    };

    const labelA = makeLabel('沿曲率进入', 700, -86, 0.75);
    const labelB = makeLabel('coordinates fold', 1500, 86, 0.55);

    // 闪白
    const fade = document.createElement('div');
    Object.assign(fade.style, {
      position: 'absolute',
      inset: '0',
      background: 'rgba(251, 250, 247, 0)',
      transition: 'background 700ms cubic-bezier(0.7, 0, 0.84, 0)',
    });
    overlay.appendChild(fade);

    await new Promise(requestAnimationFrame);

    // T+0:主页退场 + 同心圆开始显现
    if (pageRoot) {
      pageRoot.style.opacity = '0.1';
      pageRoot.style.filter = 'blur(3px)';
    }
    if (narrativeLayer) {
      narrativeLayer.style.opacity = '0';
      narrativeLayer.style.filter = 'blur(6px)';
    }
    if (sysInfo) sysInfo.style.opacity = '0';
    if (structureField) {
      structureField.style.opacity = '0.0';
      structureField.style.filter = 'blur(6px)';
    }

    rings.forEach((r, i) => {
      r.style.opacity = '0.8';
      r.setAttribute('r', `${diag * 1.6}`);
      r.setAttribute('stroke-width', '0.4');
      r.setAttribute('stroke', i % 2 === 0 ? 'rgba(46, 27, 107, 0.05)' : 'rgba(29, 78, 216, 0.05)');
    });

    // 整体旋转
    g.style.transform = 'rotate(85deg)';

    // T+600ms:奇点凸显
    setTimeout(() => {
      singularity.setAttribute('r', `${radius * 0.6}`);
    }, 600);

    // T+700/1500ms:文字
    setTimeout(() => {
      labelA.style.opacity = '0.85';
      labelA.style.transform = 'translate(-50%, calc(-50% - 110px))';
    }, 700);
    setTimeout(() => {
      labelB.style.opacity = '0.65';
      labelB.style.transform = 'translate(-50%, calc(-50% + 110px))';
    }, 1500);

    // T+2100ms:进入闪白
    setTimeout(() => {
      fade.style.background = 'rgba(251, 250, 247, 0.95)';
      singularity.style.opacity = '0';
      labelA.style.opacity = '0';
      labelB.style.opacity = '0';
    }, 2100);

    await new Promise((resolve) => setTimeout(resolve, 2600));
    fade.style.transition = 'background 180ms linear';
    fade.style.background = 'rgba(251, 250, 247, 1)';

    await new Promise((resolve) => setTimeout(resolve, 200));
    window.location.href = targetUrl;
  },
};
