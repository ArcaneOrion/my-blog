// Transition 接口：从 gateway 到 /blog 的过渡动画
// 每个 transition 是一个独立模块，play() 返回 Promise，完成后跳转

export interface TransitionCtx {
  // 圆环中心位置（gateway scene 的 anchor）
  center: { x: number; y: number };
  // 圆环半径
  radius: number;
  // 目标 URL
  targetUrl: string;
}

export interface TransitionSpec {
  id: string;
  durationMs: number;
  // 在 transition 期间，是否继续渲染 canvas 背景动画
  freezeCanvas: boolean;
  // 启动动画——返回 Promise，resolve 后主流程跳转
  play: (sctx: TransitionCtx) => Promise<void>;
}

// 公共工具
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// easeOut cubic
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// easeInOut cubic
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// 创建一个 fixed 全屏 overlay 元素并附加到 body
export function createOverlay(className = 'transition-overlay'): HTMLDivElement {
  const el = document.createElement('div');
  el.className = className;
  el.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 100;
    pointer-events: none;
    background: transparent;
    overflow: hidden;
  `;
  document.body.appendChild(el);
  return el;
}
