// fold 几何卷入式 transition
// 视觉:主页所有几何对象被一齐向圆心透视收敛;
//      圆环 rotateX 翻转成"隧道环"(伪 3D);
//      多边形网格被压缩成一点;深紫深蓝调。
// 总时长约 2600ms。

import type { TransitionSpec } from './types';
import { createOverlay } from './types';
import { navigate } from 'astro:transitions/client';

const GRID_BAND = 18;

export const foldTransition: TransitionSpec = {
  id: 'fold',
  durationMs: 2600,
  freezeCanvas: false,

  play: async ({ center, radius, targetUrl }) => {
    const overlay = createOverlay('transition-fold');
    overlay.style.perspective = '900px';

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'position:absolute;inset:0;';
    overlay.appendChild(svg);

    const W = window.innerWidth;
    const H = window.innerHeight;
    const diag = Math.hypot(W, H);

    // 主页元素退场
    const pageRoot = document.querySelector<HTMLElement>('.page-fade-in');
    const narrativeLayer = document.querySelector<HTMLElement>('.narrative-layer');
    const sysInfo = document.querySelector<HTMLElement>('.sys-info');
    const structureField = document.querySelector<HTMLElement>('[data-structure-field]');

    [pageRoot, narrativeLayer, sysInfo, structureField].forEach((el) => {
      if (el) el.style.transition = 'opacity 600ms ease, filter 800ms ease, transform 1800ms cubic-bezier(0.55, 0, 0.85, 0)';
    });

    // 网格条带:GRID_BAND 条线呈放射状,从屏幕外缘指向圆心,
    // 起点先沿屏幕边缘均匀分布,然后向圆心坍缩
    const lines: SVGLineElement[] = [];
    for (let i = 0; i < GRID_BAND; i += 1) {
      const angle = (i / GRID_BAND) * Math.PI * 2;
      const sx = center.x + Math.cos(angle) * diag * 0.7;
      const sy = center.y + Math.sin(angle) * diag * 0.7;
      const mid_x = center.x + Math.cos(angle) * radius * 1.2;
      const mid_y = center.y + Math.sin(angle) * radius * 1.2;

      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', `${sx}`);
      line.setAttribute('y1', `${sy}`);
      line.setAttribute('x2', `${sx}`);
      line.setAttribute('y2', `${sy}`);
      line.setAttribute('stroke', i % 2 === 0 ? 'rgba(46, 27, 107, 0.5)' : 'rgba(29, 78, 216, 0.4)');
      line.setAttribute('stroke-width', '1');
      line.style.transition = `all 1400ms cubic-bezier(0.55, 0, 0.85, 0) ${i * 30}ms`;
      svg.appendChild(line);

      (line as any).__endX = mid_x;
      (line as any).__endY = mid_y;
      lines.push(line);
    }

    // 中心圆环:用 div + CSS 3D rotateX 翻成"隧道环"
    const ring = document.createElement('div');
    Object.assign(ring.style, {
      position: 'absolute',
      left: `${center.x - radius}px`,
      top: `${center.y - radius}px`,
      width: `${radius * 2}px`,
      height: `${radius * 2}px`,
      borderRadius: '50%',
      border: '1.6px solid rgba(46, 27, 107, 0.7)',
      transformStyle: 'preserve-3d',
      transform: 'rotateX(0deg) scale(1)',
      transition: 'transform 1800ms cubic-bezier(0.55, 0, 0.85, 0), border-color 1400ms ease, opacity 600ms ease 1600ms',
    });
    overlay.appendChild(ring);

    // 第二个内环(模拟隧道深度)
    const innerRing = document.createElement('div');
    Object.assign(innerRing.style, {
      position: 'absolute',
      left: `${center.x - radius * 0.72}px`,
      top: `${center.y - radius * 0.72}px`,
      width: `${radius * 1.44}px`,
      height: `${radius * 1.44}px`,
      borderRadius: '50%',
      border: '1.2px solid rgba(29, 78, 216, 0.55)',
      transformStyle: 'preserve-3d',
      transform: 'rotateX(0deg) scale(1) translateZ(0)',
      transition: 'transform 2000ms cubic-bezier(0.55, 0, 0.85, 0) 100ms, border-color 1400ms ease, opacity 600ms ease 1700ms',
    });
    overlay.appendChild(innerRing);

    // 持久文字
    const makeLabel = (text: string, delay: number, yOff: number, alpha: number, italic = true) => {
      const el = document.createElement('div');
      Object.assign(el.style, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, calc(-50% + ${yOff}px))`,
        fontFamily: italic ? 'Cormorant Garamond, EB Garamond, serif' : 'JetBrains Mono, monospace',
        fontStyle: italic ? 'italic' : 'normal',
        fontSize: italic ? '1.08rem' : '0.6rem',
        letterSpacing: italic ? '0.04em' : '0.42em',
        textTransform: italic ? 'none' : 'uppercase',
        color: `rgba(46, 27, 107, ${alpha})`,
        opacity: '0',
        whiteSpace: 'nowrap',
        transition: `opacity 700ms ease ${delay}ms, transform 900ms ease ${delay}ms`,
        pointerEvents: 'none',
      });
      el.textContent = text;
      overlay.appendChild(el);
      return el;
    };

    const labelA = makeLabel('维度被卷入', 700, -100, 0.78);
    const labelB = makeLabel('R² · → · pt', 1400, 100, 0.55, false);

    const fade = document.createElement('div');
    Object.assign(fade.style, {
      position: 'absolute',
      inset: '0',
      background: 'rgba(251, 250, 247, 0)',
      transition: 'background 700ms cubic-bezier(0.7, 0, 0.84, 0)',
    });
    overlay.appendChild(fade);

    await new Promise(requestAnimationFrame);

    // T+0:主页退场,主 canvas 还做一个轻微的 perspective 收缩
    if (pageRoot) {
      pageRoot.style.opacity = '0.08';
      pageRoot.style.filter = 'blur(4px)';
    }
    if (narrativeLayer) {
      narrativeLayer.style.opacity = '0';
      narrativeLayer.style.filter = 'blur(8px)';
    }
    if (sysInfo) sysInfo.style.opacity = '0';
    if (structureField) {
      structureField.style.opacity = '0.0';
      structureField.style.filter = 'blur(6px)';
      structureField.style.transformOrigin = `${center.x}px ${center.y}px`;
      structureField.style.transform = 'scale(0.4)';
    }

    // 线条向圆心收敛
    lines.forEach((line) => {
      line.setAttribute('x1', `${(line as any).__endX}`);
      line.setAttribute('y1', `${(line as any).__endY}`);
      line.setAttribute('x2', `${center.x}`);
      line.setAttribute('y2', `${center.y}`);
      line.setAttribute('stroke-width', '0.5');
    });

    // T+600ms:圆环 rotateX 翻成隧道环
    setTimeout(() => {
      ring.style.transform = 'rotateX(78deg) scale(2.2)';
      ring.style.borderColor = 'rgba(46, 27, 107, 0.18)';
      innerRing.style.transform = 'rotateX(78deg) scale(3.4) translateZ(-40px)';
      innerRing.style.borderColor = 'rgba(29, 78, 216, 0.12)';
    }, 600);

    // T+700/1400ms:文字
    setTimeout(() => {
      labelA.style.opacity = '0.88';
      labelA.style.transform = 'translate(-50%, calc(-50% - 130px))';
    }, 700);
    setTimeout(() => {
      labelB.style.opacity = '0.6';
      labelB.style.transform = 'translate(-50%, calc(-50% + 130px))';
    }, 1400);

    // T+2000ms:开始闪白 + ring 淡出
    setTimeout(() => {
      ring.style.opacity = '0';
      innerRing.style.opacity = '0';
      fade.style.background = 'rgba(251, 250, 247, 0.95)';
      labelA.style.opacity = '0';
      labelB.style.opacity = '0';
    }, 2000);

    await new Promise((resolve) => setTimeout(resolve, 2400));
    fade.style.transition = 'background 180ms linear';
    fade.style.background = 'rgba(251, 250, 247, 1)';
    await new Promise((resolve) => setTimeout(resolve, 200));

    navigate(targetUrl);
    setTimeout(() => {
      overlay.remove();
    }, 600);
  },
};
