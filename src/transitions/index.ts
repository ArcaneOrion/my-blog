// Transitions 总索引 + 随机选择器

import type { TransitionSpec } from './types';
import { convergeTransition } from './converge';
import { burstTransition } from './burst';
import { pushTransition } from './push';

export const transitions: TransitionSpec[] = [
  convergeTransition,
  burstTransition,
  pushTransition,
];

// 随机选择一个 transition（每次进入都不同）
export function pickTransition(): TransitionSpec {
  const idx = Math.floor(Math.random() * transitions.length);
  return transitions[idx];
}

export type { TransitionSpec, TransitionCtx } from './types';
