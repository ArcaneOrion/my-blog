# arcane-orion 博客

主人（arcane / arcane orion）的个人博客。当前阶段：前端审美设计与背景几何系统，文章内容未启动。

## 设计哲学

- **数学结构即视觉语言**：不贴数学符号，而是把数学概念（图论、流形、星座/球面投影）做成装饰性动画
- **白色简约 + 动态数学几何**：白底 #fbfaf7，深色几何线条 + 极淡网格
- **统一点云空间**：背景不是分镜场景，而是一个持续存在的几何空间——5 个主页 stage 切换的是"点云的目标布局"，不是场景
- **鼠标交互即叙事**："感知产生结构"——鼠标靠近时连线加深、点被吸引
- **数学语义外露**：抽样标 `(x, y)` 坐标、希腊字母标注、sys-info HUD（mapping · S² → R² 等）

## 技术栈

- Astro 5 + React 19 + Tailwind 3
- 背景动画：原生 Canvas 2D（不用 p5.js/Three.js）
- 字体：Italiana（标题）+ EB Garamond（正文）+ JetBrains Mono（mono）+ Cormorant Garamond Italic（装饰）
- Nix 环境（`flake.nix` + `direnv`），构建工具不全局装

## 命令

```bash
nix develop          # 进入开发环境
npm run dev          # http://localhost:4321/my-blog
npm run build        # 输出 dist/
npm run preview      # 预览 build
```

## 关键文件

| 路径 | 职责 |
|------|------|
| `src/components/StructureField.astro` | 核心 Canvas 动画——统一点云 + 鼠标交互 + stage 切换 |
| `src/pages/index.astro` | 主页 5 stage（entry/circle/projection/field/closing）+ sys-info HUD |
| `src/styles/global.css` | 设计 token、reveal 滚动渐入、sys-info 样式 |
| `src/layouts/BaseLayout.astro` | 字体加载（Google Fonts link） |
| `tailwind.config.mjs` | 配色 + 字体配置 |
| `src/content/blog/` | Markdown 文章源 |
| `模板/` | 设计参考（两个手写 HTML），不是产品代码 |

## 修改约定

- **字体改动必须同步三处**：`BaseLayout.astro` 的 `<link>` + `global.css` 的 `--font-*` + `tailwind.config.mjs` 的 `fontFamily`
- **StructureField 性能敏感**：42fps cap + visibility API 已加，N²/2 连线计算控制在 ~70 点以内
- **stage 切换语义**：不切换场景，只改 `applyStageLayout()` 里点的 `targetX/Y` 和 `role`
- **sys-info 文本**：在 `index.astro` 的 `sysInfoMap` 里，stage → 三行文本（space / status / object）
- **猎户座数据写死**在 StructureField.astro 的 `orionStars` 数组，希腊字母对应主星

## 部署

GitHub Pages + Actions（见 `DESIGN.md` 第 8 节，workflow 尚未落地）。`astro.config.mjs` 中 `base: '/my-blog'`。

## 当前进度

- 主页 5 stage 完成
- Math/AI/Quant 子页面骨架存在但未单独设计（计划沿用主页动画风格）
- 神经科学层延后
- 文章内容尚未开始写
