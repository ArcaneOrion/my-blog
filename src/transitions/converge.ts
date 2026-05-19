// α 收束式：圆环放大 + 全屏 fade
// 节奏：圆环 600ms 放大旋转 → 同时白色 overlay 800ms 渐入 → 200ms 缓冲 → 跳转

import type { TransitionSpec } from './types';
import { createOverlay, easeOutCubic } from './types';

export const convergeTransition: TransitionSpec = {
  id: 'converge',
  durationMs: 1000,
  freezeCanvas: false,

  play: async ({ center, radius, targetUrl }) => {
    const overlay = createOverlay('transition-converge');
    const ring = document.createElement('div');
    const fade = document.createElement('div');
    overlay.appendChild(ring);
    overlay.appendChild(fade);

    // 圆环：放在 gateway 圆环位置，从原大小放大到 4x
    Object.assign(ring.style, {
      position: 'absolute',
      left: `${center.x - radius}px`,
      top: `${center.y - radius}px`,
      width: `${radius * 2}px`,
      height: `${radius * 2}px`,
      borderRadius: '50%',
      border: '1.5px solid rgba(29, 78, 216, 0.7)',
      opacity: '0',
      transform: 'scale(1) rotate(0deg)',
      transition: 'transform 900ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 200ms ease, border-color 900ms ease',
      boxShadow: '0 0 0 0 rgba(29, 78, 216, 0.18)',
    });

    Object.assign(fade.style, {
      position: 'absolute',
      inset: '0',
      background: 'rgba(251, 250, 247, 0)',
      transition: 'background 900ms cubic-bezier(0.4, 0, 0.2, 1)',
    });

    // 启动
    await new Promise(requestAnimationFrame);
    ring.style.opacity = '1';
    ring.style.transform = 'scale(4) rotate(120deg)';
    ring.style.borderColor = 'rgba(29, 78, 216, 0.05)';
    fade.style.background = 'rgba(251, 250, 247, 0.98)';

    // 等到 90% 完成（不等全程，跳转后再消失）
    await new Promise((resolve) => setTimeout(resolve, 850));

    // 最后一小段：完全变白
    fade.style.transition = 'background 200ms linear';
    fade.style.background = 'rgba(251, 250, 247, 1)';
    await new Promise((resolve) => setTimeout(resolve, 200));

    // 跳转
    window.location.href = targetUrl;
  },
};
