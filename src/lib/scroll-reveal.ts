// Scroll-linked reveal 系统
// 每个 [data-reveal] 元素根据自身在视口内的位置，
// 实时计算 progress (0-1) 写入 CSS 变量 --reveal-progress
//
// 进度计算：
//   元素顶部进入视口底部 (progress=0) → 元素整体处于视口中心 (progress=1)
//
// CSS 用变量插值 opacity / translateY / blur / scale。

export interface RevealOptions {
  // 视口底部多大比例作为"出场起点"。默认 0.92 → 元素顶部到达视口 92% 高度时 progress=0
  enterThreshold?: number;
  // 元素中心到达视口多少比例时 progress=1。默认 0.45
  arriveThreshold?: number;
  // 子元素错峰延迟（如 italicCopy 多行）。如果非 null，元素的 [data-reveal-stagger] 子元素按顺序应用相对延迟
  staggerChildren?: boolean;
}

const defaultOptions: Required<RevealOptions> = {
  enterThreshold: 0.92,
  arriveThreshold: 0.45,
  staggerChildren: true,
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function initScrollReveal(opts: RevealOptions = {}): () => void {
  const options = { ...defaultOptions, ...opts };
  const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (elements.length === 0) return () => {};

  let rafId = 0;
  let scheduled = false;

  function compute() {
    scheduled = false;
    const vh = window.innerHeight;
    const enterY = vh * options.enterThreshold;
    const arriveY = vh * options.arriveThreshold;
    const range = Math.max(1, enterY - arriveY);

    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      const elementTop = rect.top;
      // raw 进度：从 enterY 开始到 arriveY 结束
      const raw = (enterY - elementTop) / range;
      const progress = clamp01(easeOutCubic(clamp01(raw)));
      el.style.setProperty('--reveal-progress', progress.toFixed(3));
    }
  }

  function onScroll() {
    if (scheduled) return;
    scheduled = true;
    rafId = requestAnimationFrame(compute);
  }

  // 初始化时立即算一次（首屏可见元素直接到位）
  compute();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}
