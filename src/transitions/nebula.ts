// nebula 引力坍缩式 transition
// 视觉:200 颗粒子从屏幕外缘被吸入圆心;粒子尾迹拉长;
//      圆环变成发光奇点;深紫深蓝呼吸感。
// 总时长约 3000ms。

import type { TransitionSpec } from './types';
import { createOverlay } from './types';

const PARTICLE_COUNT = 220;

interface Particle {
  // 初始位置(屏幕外缘)
  startX: number;
  startY: number;
  // 当前位置(由动画驱动)
  hue: 'violet' | 'blue' | 'ink';
  size: number;
  delayMs: number;
  durMs: number;
}

const colorMap = {
  violet: 'rgba(82, 38, 158,',
  blue: 'rgba(29, 78, 216,',
  ink: 'rgba(40, 22, 90,',
};

export const nebulaTransition: TransitionSpec = {
  id: 'nebula',
  durationMs: 3000,
  freezeCanvas: false,

  play: async ({ center, radius, targetUrl }) => {
    const overlay = createOverlay('transition-nebula');

    // 用一张独立 canvas 来画粒子(高效)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.cssText = `position:absolute;inset:0;width:${W}px;height:${H}px;`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    overlay.appendChild(canvas);

    // 生成粒子
    const particles: Particle[] = [];
    const rand = Math.random;
    const diag = Math.hypot(W, H);
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const ang = rand() * Math.PI * 2;
      const startR = diag * (0.55 + rand() * 0.4);
      particles.push({
        startX: center.x + Math.cos(ang) * startR,
        startY: center.y + Math.sin(ang) * startR,
        hue: rand() < 0.45 ? 'violet' : rand() < 0.75 ? 'blue' : 'ink',
        size: 0.6 + rand() * 1.6,
        delayMs: rand() * 600,
        durMs: 1400 + rand() * 800,
      });
    }

    // 主页元素退场
    const pageRoot = document.querySelector<HTMLElement>('.page-fade-in');
    const narrativeLayer = document.querySelector<HTMLElement>('.narrative-layer');
    const sysInfo = document.querySelector<HTMLElement>('.sys-info');
    const structureField = document.querySelector<HTMLElement>('[data-structure-field]');

    [pageRoot, narrativeLayer, sysInfo, structureField].forEach((el) => {
      if (el) el.style.transition = 'opacity 800ms ease, filter 1000ms ease';
    });

    // 中心光晕 div(纯 CSS,粒子之外)
    const halo = document.createElement('div');
    const haloSize = radius * 2;
    Object.assign(halo.style, {
      position: 'absolute',
      left: `${center.x - haloSize / 2}px`,
      top: `${center.y - haloSize / 2}px`,
      width: `${haloSize}px`,
      height: `${haloSize}px`,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(82, 38, 158, 0.55), rgba(29, 78, 216, 0.18) 50%, transparent 75%)',
      filter: 'blur(8px)',
      opacity: '0',
      transform: 'scale(0.3)',
      transition: 'opacity 1200ms ease, transform 1800ms cubic-bezier(0.55, 0, 0.85, 0)',
      pointerEvents: 'none',
    });
    overlay.appendChild(halo);

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
        color: `rgba(82, 38, 158, ${alpha})`,
        opacity: '0',
        whiteSpace: 'nowrap',
        transition: `opacity 800ms ease ${delay}ms, transform 1000ms ease ${delay}ms`,
        pointerEvents: 'none',
      });
      el.textContent = text;
      overlay.appendChild(el);
      return el;
    };

    const labelA = makeLabel('被引力收回', 700, -120, 0.75);
    const labelB = makeLabel('field · collapse', 1700, 120, 0.55, false);

    // 闪白
    const fade = document.createElement('div');
    Object.assign(fade.style, {
      position: 'absolute',
      inset: '0',
      background: 'rgba(251, 250, 247, 0)',
      transition: 'background 800ms cubic-bezier(0.7, 0, 0.84, 0)',
    });
    overlay.appendChild(fade);

    // 启动:主页退场 + halo 出现
    await new Promise(requestAnimationFrame);
    if (pageRoot) {
      pageRoot.style.opacity = '0.08';
      pageRoot.style.filter = 'blur(4px)';
    }
    if (narrativeLayer) {
      narrativeLayer.style.opacity = '0';
      narrativeLayer.style.filter = 'blur(6px)';
    }
    if (sysInfo) sysInfo.style.opacity = '0';
    if (structureField) {
      structureField.style.opacity = '0';
      structureField.style.filter = 'blur(6px)';
    }

    setTimeout(() => {
      halo.style.opacity = '1';
      halo.style.transform = 'scale(1.6)';
    }, 100);

    setTimeout(() => {
      labelA.style.opacity = '0.85';
      labelA.style.transform = 'translate(-50%, calc(-50% - 140px))';
    }, 700);
    setTimeout(() => {
      labelB.style.opacity = '0.65';
      labelB.style.transform = 'translate(-50%, calc(-50% + 140px))';
    }, 1700);

    // 粒子动画:用 rAF 驱动
    const startTime = performance.now();
    const totalDur = 2500;
    let stopped = false;

    function tick(now: number) {
      if (stopped) return;
      const t = now - startTime;
      ctx!.clearRect(0, 0, W, H);

      for (const p of particles) {
        const localT = (t - p.delayMs) / p.durMs;
        if (localT < 0) continue;
        const ease = Math.pow(Math.min(1, localT), 2.2); // easeIn

        const x = p.startX + (center.x - p.startX) * ease;
        const y = p.startY + (center.y - p.startY) * ease;

        const remaining = 1 - ease;
        const alpha = remaining * 0.7;

        // 尾迹:从当前位置反向画一小段
        const dx = (center.x - p.startX) * 0.06 * remaining;
        const dy = (center.y - p.startY) * 0.06 * remaining;
        ctx!.strokeStyle = `${colorMap[p.hue]} ${alpha * 0.5})`;
        ctx!.lineWidth = p.size * 0.6;
        ctx!.beginPath();
        ctx!.moveTo(x + dx, y + dy);
        ctx!.lineTo(x, y);
        ctx!.stroke();

        // 粒子头
        ctx!.fillStyle = `${colorMap[p.hue]} ${alpha})`;
        ctx!.beginPath();
        ctx!.arc(x, y, p.size, 0, Math.PI * 2);
        ctx!.fill();
      }

      if (t < totalDur + 200) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);

    // T+2400ms:闪白 + 文字退
    setTimeout(() => {
      fade.style.background = 'rgba(251, 250, 247, 0.96)';
      halo.style.opacity = '0';
      labelA.style.opacity = '0';
      labelB.style.opacity = '0';
    }, 2400);

    await new Promise((resolve) => setTimeout(resolve, 2800));
    stopped = true;
    fade.style.transition = 'background 180ms linear';
    fade.style.background = 'rgba(251, 250, 247, 1)';

    await new Promise((resolve) => setTimeout(resolve, 200));
    window.location.href = targetUrl;
  },
};
