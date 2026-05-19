// Scene 系统类型定义
// 每个 scene 是一个独立模块，定义自己的点云布局、装饰几何、数学语义和文案

export type ColorTuple = [number, number, number];

export interface PointState {
  index: number;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  phase: number;
  role: string;
  meta: Record<string, unknown>;
}

export interface SceneCtx {
  width: number;
  height: number;
  time: number;
  compact: boolean;
  pointer: { x: number; y: number; active: boolean };
  color: ColorTuple;
  ink: ColorTuple;
}

export interface SceneAnchor {
  // 视觉中心位置（0-1 归一化）
  x: number;
  y: number;
}

export interface SysInfoLines {
  space: string;
  status: string;
  object: string;
}

export interface SceneCopy {
  glyph: string;          // 大字符（⊙ / ∿ / 等）
  sectionLabel: string;   // 罗马数字 + 主题，如 "i. circle"
  italicCopy: string;     // 浪漫副文案（支持 \n）
  sideNote?: string;      // 右侧 mono 注脚（可选）
}

export interface SceneSpec {
  id: string;
  anchor: SceneAnchor;
  sysInfo: SysInfoLines;
  copy: SceneCopy;
  // 设置每个点的 targetX/Y 和 role
  layout: (points: PointState[], sctx: SceneCtx) => void;
  // 在点和连线之外的几何装饰层
  drawLayers?: (ctx: CanvasRenderingContext2D, points: PointState[], sctx: SceneCtx) => void;
  // 数学符号 / 坐标标注
  annotate?: (ctx: CanvasRenderingContext2D, points: PointState[], sctx: SceneCtx) => void;
  // 命中测试：判断 canvas 坐标 (x, y) 是否落在 scene 的可点击区域
  hitTest?: (x: number, y: number, sctx: SceneCtx) => boolean;
  // 点击处理（如触发过渡）
  onClick?: (sctx: SceneCtx) => void;
  // 鼠标悬停在 hit 区域时的光标样式
  cursor?: string;
}

export function rgba(color: ColorTuple, alpha: number): string {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}
