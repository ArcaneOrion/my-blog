// Scenes 总索引：按主页 stage 顺序排列
// 修改顺序或增删 scene 只需要改这一个文件

import type { SceneSpec } from './types';
import { entryScene } from './entry';
import { linearAlgebraScene } from './linearAlgebra';
import { analysisScene } from './analysis';
import { probabilityScene } from './probability';
import { gatewayScene } from './gateway';

export const scenes: SceneSpec[] = [
  entryScene,
  linearAlgebraScene,
  analysisScene,
  probabilityScene,
  gatewayScene,
];

export const scenesById: Record<string, SceneSpec> = Object.fromEntries(
  scenes.map((s) => [s.id, s]),
);

export type { SceneSpec, PointState, SceneCtx, SysInfoLines, SceneCopy } from './types';
