// Transitions 总索引 + 主选择器
//
// 当前主选池(等权随机):wormhole / nebula / fold
// 旧的 portal / converge / burst / push 保留作为归档,不参与主选

import type { TransitionSpec } from './types';
import { wormholeTransition } from './wormhole';
import { nebulaTransition } from './nebula';
import { foldTransition } from './fold';
// 归档(保留文件,不进主选池)
import { portalTransition } from './portal';
import { convergeTransition } from './converge';
import { burstTransition } from './burst';
import { pushTransition } from './push';

const mainPool: TransitionSpec[] = [
  wormholeTransition,
  nebulaTransition,
  foldTransition,
];

export const transitions: TransitionSpec[] = [
  ...mainPool,
  // 归档:
  portalTransition,
  convergeTransition,
  burstTransition,
  pushTransition,
];

// 等权随机
export function pickTransition(): TransitionSpec {
  const idx = Math.floor(Math.random() * mainPool.length);
  return mainPool[idx];
}

export type { TransitionSpec, TransitionCtx } from './types';
