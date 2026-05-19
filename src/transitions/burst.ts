// β 爆开式：圆环爆开成放射线 + 屏幕被几何"撕开"
// 1500ms：8 条放射线从圆环射出，覆盖全屏；屏幕被两条对角斜线"撕开"；末端 fade

import type { TransitionSpec } from './types';
import { createOverlay } from './types';

const RAY_COUNT = 12;

export const burstTransition: TransitionSpec = {
  id: 'burst',
  durationMs: 1500,
  freezeCanvas: false,

  play: async ({ center, radius, targetUrl }) => {
    const overlay = createOverlay('transition-burst');

    // SVG 容器
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'position:absolute;inset:0;';
    overlay.appendChild(svg);

    const diag = Math.hypot(window.innerWidth, window.innerHeight);

    // 12 条放射线
    const rays: SVGLineElement[] = [];
    for (let i = 0; i < RAY_COUNT; i += 1) {
      const angle = (i / RAY_COUNT) * Math.PI * 2 + Math.random() * 0.1;
      const line = document.createElementNS(svgNS, 'line');
      const x2Initial = center.x + Math.cos(angle) * radius;
      const y2Initial = center.y + Math.sin(angle) * radius;
      line.setAttribute('x1', `${center.x + Math.cos(angle) * radius * 0.6}`);
      line.setAttribute('y1', `${center.y + Math.sin(angle) * radius * 0.6}`);
      line.setAttribute('x2', `${x2Initial}`);
      line.setAttribute('y2', `${y2Initial}`);
      line.setAttribute('stroke', 'rgba(29, 78, 216, 0.7)');
      line.setAttribute('stroke-width', '1.2');
      line.style.transition = `all ${800 + i * 16}ms cubic-bezier(0.22, 0.61, 0.36, 1)`;
      svg.appendChild(line);
      rays.push(line);

      // 记录目标端点
      (line as any).__targetX = center.x + Math.cos(angle) * diag;
      (line as any).__targetY = center.y + Math.sin(angle) * diag;
    }

    // 两条对角"撕开"线（从中心向左上 + 右下伸展）
    const tearLines: SVGLineElement[] = [];
    for (let i = 0; i < 2; i += 1) {
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', `${center.x}`);
      line.setAttribute('y1', `${center.y}`);
      line.setAttribute('x2', `${center.x}`);
      line.setAttribute('y2', `${center.y}`);
      line.setAttribute('stroke', 'rgba(23, 24, 28, 0.16)');
      line.setAttribute('stroke-width', '0.8');
      line.style.transition = 'all 1200ms cubic-bezier(0.22, 0.61, 0.36, 1)';
      svg.appendChild(line);
      tearLines.push(line);
    }

    // 中心圆环（同步放大消失）
    const ringCircle = document.createElementNS(svgNS, 'circle');
    ringCircle.setAttribute('cx', `${center.x}`);
    ringCircle.setAttribute('cy', `${center.y}`);
    ringCircle.setAttribute('r', `${radius}`);
    ringCircle.setAttribute('fill', 'none');
    ringCircle.setAttribute('stroke', 'rgba(29, 78, 216, 0.5)');
    ringCircle.setAttribute('stroke-width', '1.4');
    ringCircle.style.transition = 'all 1100ms cubic-bezier(0.22, 0.61, 0.36, 1)';
    svg.appendChild(ringCircle);

    // 白色 fade overlay
    const fade = document.createElement('div');
    Object.assign(fade.style, {
      position: 'absolute',
      inset: '0',
      background: 'rgba(251, 250, 247, 0)',
      transition: 'background 1200ms ease-in',
    });
    overlay.appendChild(fade);

    // 触发动画
    await new Promise(requestAnimationFrame);

    rays.forEach((line) => {
      line.setAttribute('x2', `${(line as any).__targetX}`);
      line.setAttribute('y2', `${(line as any).__targetY}`);
      line.setAttribute('stroke', 'rgba(29, 78, 216, 0.05)');
      line.setAttribute('stroke-width', '0.4');
    });

    // 对角撕裂线
    tearLines[0].setAttribute('x2', `${-diag}`);
    tearLines[0].setAttribute('y2', `${-diag}`);
    tearLines[1].setAttribute('x2', `${diag + window.innerWidth}`);
    tearLines[1].setAttribute('y2', `${diag + window.innerHeight}`);

    // 圆环放大消失
    ringCircle.setAttribute('r', `${radius * 5}`);
    ringCircle.setAttribute('stroke', 'rgba(29, 78, 216, 0)');

    fade.style.background = 'rgba(251, 250, 247, 0.96)';

    await new Promise((resolve) => setTimeout(resolve, 1300));

    // 最后一闪白
    fade.style.transition = 'background 200ms linear';
    fade.style.background = 'rgba(251, 250, 247, 1)';
    await new Promise((resolve) => setTimeout(resolve, 200));

    window.location.href = targetUrl;
  },
};
