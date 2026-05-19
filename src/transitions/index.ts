// Transitions 总索引 + 主选择器
//
// 当前唯一主选：portal（穿越式）。
// 旧的 converge / burst / push 文件保留作为可选变体，但不进入轮换。

import type { TransitionSpec } from './types';
import { portalTransition } from './portal';
import { convergeTransition } from './converge';
import { burstTransition } from './burst';
import { pushTransition } from './push';

export const transitions: TransitionSpec[] = [
  portalTransition,
  // 保留旧动画供未来需要时启用：
  convergeTransition,
  burstTransition,
  pushTransition,
];

// 当前主选：固定 portal（一致的"穿越"主题）
export function pickTransition(): TransitionSpec {
  return portalTransition;
}

export type { TransitionSpec, TransitionCtx } from './types';
