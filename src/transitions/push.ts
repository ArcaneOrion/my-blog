// γ 平推式：圆环淡出 + 白色面板从底部推上 + 上层 fade
// 2000ms：圆环收缩 → 白色面板从屏幕底部 800ms 推上覆盖 → 200ms hold → 跳转

import type { TransitionSpec } from './types';
import { createOverlay } from './types';

export const pushTransition: TransitionSpec = {
  id: 'push',
  durationMs: 2000,
  freezeCanvas: false,

  play: async ({ center, radius, targetUrl }) => {
    const overlay = createOverlay('transition-push');

    // 中心圆环：先轻微收缩+暗示
    const ring = document.createElement('div');
    Object.assign(ring.style, {
      position: 'absolute',
      left: `${center.x - radius}px`,
      top: `${center.y - radius}px`,
      width: `${radius * 2}px`,
      height: `${radius * 2}px`,
      borderRadius: '50%',
      border: '1.5px solid rgba(29, 78, 216, 0.7)',
      transform: 'scale(1)',
      transition: 'transform 500ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 600ms ease',
      opacity: '1',
    });
    overlay.appendChild(ring);

    // 推上的面板（从底部覆盖整个屏幕）
    const panel = document.createElement('div');
    Object.assign(panel.style, {
      position: 'absolute',
      left: '0',
      right: '0',
      bottom: '0',
      height: '100vh',
      background: 'linear-gradient(180deg, rgba(251, 250, 247, 0.98), rgba(247, 244, 238, 1))',
      transform: 'translateY(100%)',
      transition: 'transform 1100ms cubic-bezier(0.65, 0, 0.35, 1)',
      boxShadow: '0 -32px 80px rgba(15, 23, 42, 0.08)',
    });
    overlay.appendChild(panel);

    // 面板顶部一根细线 + sys-info 风格的小字（"loading next layer"）
    const hairline = document.createElement('div');
    Object.assign(hairline.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      height: '1px',
      background: 'linear-gradient(90deg, transparent, rgba(29, 78, 216, 0.35), transparent)',
      transform: 'scaleX(0)',
      transition: 'transform 800ms ease 600ms',
    });
    panel.appendChild(hairline);

    const label = document.createElement('div');
    Object.assign(label.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontFamily: 'JetBrains Mono, IBM Plex Mono, monospace',
      fontSize: '0.62rem',
      letterSpacing: '0.36em',
      textTransform: 'uppercase',
      color: 'rgba(141, 148, 160, 0.9)',
      opacity: '0',
      transition: 'opacity 500ms ease 900ms',
    });
    label.textContent = 'descending · into · records';
    panel.appendChild(label);

    await new Promise(requestAnimationFrame);

    // 步骤 1: 圆环收缩
    ring.style.transform = 'scale(0.4)';
    ring.style.opacity = '0';

    // 步骤 2: 面板推上
    await new Promise((resolve) => setTimeout(resolve, 200));
    panel.style.transform = 'translateY(0)';
    hairline.style.transform = 'scaleX(1)';
    label.style.opacity = '1';

    // 步骤 3: 等推上完成 + label 短暂停留
    await new Promise((resolve) => setTimeout(resolve, 1500));

    window.location.href = targetUrl;
  },
};
