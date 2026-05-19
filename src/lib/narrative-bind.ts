// Narrative bind：HTML 诗句容器 ↔ canvas scene 几何锚点
//
// 数据流：
//   StructureField 每帧把当前 scene 的状态写入 window.__structureSceneState
//   （anchorX, anchorY, progress, stretch, stageId, width, height）。
//   这里在自己的 rAF 循环里读取，为每个 [data-narrative-scene] 容器
//   设置 CSS 变量：
//     --anchor-x         px        锚点相对视口
//     --anchor-y         px
//     --narrative-p      0-1       该 scene 进入后的进度
//     --narrative-stretch 0-1      几何扰动幅度（驱动 letter-spacing）
//
// 容器自身用绝对定位 + 这些变量驱动 transform/opacity/blur/letter-spacing。

interface StructureSceneState {
  stageId: string;
  anchorX: number | null;
  anchorY: number | null;
  progress: number;
  stretch: number;
  width: number;
  height: number;
}

export function initNarrativeBind(): () => void {
  const containers = Array.from(
    document.querySelectorAll<HTMLElement>('[data-narrative-scene]'),
  );
  if (containers.length === 0) return () => {};

  let rafId = 0;
  let stopped = false;

  function frame() {
    if (stopped) return;
    rafId = requestAnimationFrame(frame);

    const state = (window as any).__structureSceneState as StructureSceneState | undefined;
    if (!state) return;

    for (const el of containers) {
      const sceneId = el.dataset.narrativeScene;
      const active = sceneId === state.stageId;

      if (active && state.anchorX !== null && state.anchorY !== null) {
        el.style.setProperty('--anchor-x', `${state.anchorX}px`);
        el.style.setProperty('--anchor-y', `${state.anchorY}px`);
        el.style.setProperty('--narrative-p', state.progress.toFixed(3));
        el.style.setProperty('--narrative-stretch', state.stretch.toFixed(3));
        el.classList.add('is-narrative-active');
      } else {
        // 非当前 scene：进度归零，容器淡出
        el.style.setProperty('--narrative-p', '0');
        el.classList.remove('is-narrative-active');
      }
    }
  }

  rafId = requestAnimationFrame(frame);

  return () => {
    stopped = true;
    cancelAnimationFrame(rafId);
  };
}
